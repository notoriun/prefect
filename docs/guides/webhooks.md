---
description: Observe and react to events from other systems
tags:
    - events
    - automations
    - triggers
    - webhooks
    - Prefect Cloud
---

# Webhooks <span class="badge cloud"></span>

Use webhooks in your Prefect Cloud workspace to receive, observe, and react to events
from other systems in your ecosystem.  Each webhook exposes a unique URL endpoint to
receive events from other systems and transforms them into Prefect
[events](/cloud/events/) for use in [automations](/cloud/automations/).

Webhooks are defined by two essential components: a unique URL and a template which
translates incoming web requests to a Prefect event.

## Configuring webhooks

### Via the Prefect Cloud API

Webhooks are managed via the [Webhooks API
endpoints](https://app.prefect.cloud/api/docs#tag/Webhooks).  This is a Prefect
Cloud-only feature. You authenticate API calls using the standard
[authentication methods you use with Prefect
Cloud](/cloud/connecting#manually-configure-prefect-api-settings).

### Via Prefect Cloud

Webhooks can be created and managed from the Prefect Cloud UI.

![Managing a webhook in the Prefect Cloud UI.](/img/ui/webhook.png)

### Via the Prefect CLI

Webhooks can be managed and interacted with via the `prefect cloud webhook` command group.

```bash
prefect cloud webhook --help
```

You can create your first webhook by invoking `create`:

```bash
prefect cloud webhook create your-webhook-name \
    --description "Receives webhooks from your system" \
    --template '{ "event": "your.event.name", "resource": { "prefect.resource.id": "your.resource.id" } }'
```

Note the template string, which is discussed in [greater detail down below](#webhook-templates)

You can retrieve details for a specific webhook by ID using `get`, or optionally query
all webhooks in your workspace via `ls`:

```bash
# get webhook by ID
prefect cloud webhook get <webhook-id>

# list all configured webhooks in your workspace
prefect cloud webhook ls
```

If you ever need to disable an existing webhook without deleting it, use `toggle`:

```bash
prefect cloud webhook toggle <webhook-id>
Webhook is now disabled

prefect cloud webhook toggle <webhook-id>
Webhook is now enabled
```

If you are concerned that your webhook endpoint may have been compromised, use `rotate` to
generate a new, random endpoint

```bash
prefect cloud webhook rotate <webhook-url-slug>
```

## Webhook endpoints

The webhook endpoints have randomly generated opaque URLs that do not divulge any
information about your Prefect Cloud workspace.  They are rooted at
`https://api.prefect.cloud/hooks/`. For example:
`https://api.prefect.cloud/hooks/AERylZ_uewzpDx-8fcweHQ`.
Prefect Cloud assigns this URL when you create a webhook; it cannot be set via the API.
You may rotate your webhook URL at any time without
losing the associated configuration.

All webhooks may accept requests via the most common HTTP methods:

* `GET`, `HEAD`, and `DELETE` may be used for webhooks that define a static event
  template, or a template that does not depend on the _body_ of the HTTP request.  The
  headers of the request will be available for templates.
* `POST`, `PUT`, and `PATCH` may be used when the webhook request will include a body.
  See [How HTTP request components are
  handled](#how-http-request-components-are-handled) for more details on how the body is
  parsed.

Prefect Cloud webhooks are deliberately quiet to the outside world, and will only return
a `204 No Content` response when they are successful, and a `400 Bad Request` error when
there is any error interpreting the request.  For more visibility when your webhooks
fail, see the [Troubleshooting](#troubleshooting) section below.

## Webhook templates

The purpose of a webhook is to accept an HTTP request from another system and produce a
Prefect event from it.  You may find that you often have little influence or control
over the format of those requests, so Prefect's webhook system gives you full control
over how you turn those notifications from other systems into meaningful events in your
Prefect Cloud workspace.  The template you define for each webhook will determine how
individual components of the incoming HTTP request become the event name and resource
labels of the resulting Prefect event.

As with the [templates available in Prefect Cloud Automation](/cloud/automations) for
defining notifications and other parameters, you will write templates in
[Jinja2](https://jinja.palletsprojects.com/en/3.1.x/templates/).  All of the built-in
Jinja2 blocks and filters are available, as well as the filters from the
[`jinja2-humanize-extensions`
package](https://pypi.org/project/jinja2-humanize-extension/).

Your goal when defining your event template is to produce a valid JSON object that
defines (at minimum) the `event` name and the `resource["prefect.resource.id"]`, which
are required of all events.  The simplest template is one in which these are statically
defined.

### Static webhook events

Let's see a static webhook template example.  Say you want to configure a webhook that
will notify Prefect when your `recommendations` machine learning model has been updated,
so you can then send a Slack notification to your team and run a few subsequent
deployments.  Those models are produced on a daily schedule by another team that is
using `cron` for scheduling. They aren't able to use Prefect for their flows (yet!), but
they are happy to add a `curl` to the end of their daily script to notify you. Because
this webhook will only be used for a single event from a single resource, your template
can be entirely static:

```JSON
{
    "event": "model.refreshed",
    "resource": {
        "prefect.resource.id": "product.models.recommendations",
        "prefect.resource.name": "Recommendations [Products]",
        "producing-team": "Data Science"
    }
}
```

!!! tip "Make sure to produce valid JSON"

    The output of your template, when rendered, should be a valid string that can be
    parsed, for example, with `json.loads`.

A webhook with this template may be invoked via _any_ of the HTTP methods, including a
`GET` request with no body, so the team you are integrating with can include this line at the
end of their daily script:

```bash
curl https://api.prefect.cloud/hooks/AERylZ_uewzpDx-8fcweHQ
```

Each time the script hits the webhook, the webhook will produce a single
Prefect event with that name and resource in your workspace.

### Event fields that Prefect Cloud populates for you

You may notice that you only had to provide the `event` and `resource` definition, which
is not a completely fleshed out event.  Prefect Cloud will set default values for any
missing fields, such as `occurred` and `id`, so you don't need to set them in your
template.  Additionally, Prefect Cloud will add the webhook itself as a related resource
on all of the events it produces.

If your template does not produce a `payload` field, the `payload` will default to a
standard set of debugging information, including the HTTP method, headers, and body.

### Dynamic webhook events

Now let's say that after a few days you and the Data Science team are getting a lot of
value from the automations you have set up with the static webhook.  You've agreed to
upgrade this webhook to handle all of the various models that the team produces.  It's
time to add some dynamic information to your webhook template.

Your colleagues on the team have adjusted their daily `cron` scripts to `POST` a
small body that includes the ID and name of the model that was updated:

```bash
curl \
    -d "model=recommendations" \
    -d "friendly_name=Recommendations%20[Products]" \
    -X POST https://api.prefect.cloud/hooks/AERylZ_uewzpDx-8fcweHQ
```

This script will send a `POST` request and the body will include a traditional
URL-encoded form with two fields describing the model that was updated: `model` and
`friendly_name`. Here's the webhook code that uses Jinja to receive these values in your
template and produce different events for the different models:

```jinja2
{
    "event": "model.refreshed",
    "resource": {
        "prefect.resource.id": "product.models.{{ body.model }}",
        "prefect.resource.name": "{{ body.friendly_name }}",
        "producing-team": "Data Science"
    }
}
```

All subsequent `POST` requests will produce events with those variable
resource IDs and names.  The other statically-defined parts, such as `event` or the
`producing-team` label you included earlier will still be used.

!!! tip "Use Jinja2's `default` filter to handle missing values"

    Jinja2 has a helpful [`default`](https://jinja.palletsprojects.com/en/3.1.x/templates/#jinja-filters.default)
    filter that can compensate for missing values in the request.  In this example,
    you may want to use the model's ID in place of the friendly name when the friendly name is not
    provided: `{{ body.friendly_name|default(body.model) }}`.

### How HTTP request components are handled

The Jinja2 template context includes the three parts of the incoming HTTP request:

* `method` is the uppercased string of the HTTP method, like `GET` or `POST`.
* `headers` is a case-insensitive dictionary of the HTTP headers included with the
  request.  To prevent accidental disclosures, the `Authorization` header is removed.
* `body` represents the body that was posted to the webhook, with a best-effort approach
  to parse it into an object you can access.

HTTP headers are available without any alteration as a `dict`-like object, but you may
access them with header names in any case.  For example, these template expressions all
return the value of the `Content-Length` header:

```jinja2
{{ headers['Content-Length'] }}

{{ headers['content-length'] }}

{{ headers['CoNtEnt-LeNgTh'] }}
```

The HTTP request body goes through some light preprocessing to make it more useful in
templates.  If the `Content-Type` of the request is `application/json`, the body will be
parsed as a JSON object and made available to the webhook templates.  If the
`Content-Type` is `application/x-www-form-urlencoded` (as in our example above), the
body is parsed into a flat `dict`-like object of key-value pairs.  Jinja2 supports both
index and attribute access to the fields of these objects, so the following two
expressions are equivalent:

```jinja2
{{ body['friendly_name'] }}

{{ body.friendly_name }}
```

!!! tip "Only for Python identifiers"

    Jinja2's syntax only allows attribute-like access if the key is a valid Python
    identifier, so `body.friendly-name` will not work.  Use `body['friendly-name']` in
    those cases.

You may not have much control over the client invoking your webhook, but would still
like for bodies that look like JSON to be parsed as such.  Prefect Cloud will attempt to
parse any other content type (like `text/plain`) as if it were JSON first.  In any case
where the body cannot be transformed into JSON, it will be made available to your
templates as a Python `str`.

### Accepting Prefect events directly

In cases where you have more control over the client, your webhook can accept Prefect
events directly with a simple pass-through template:

```jinja2
{{ body|tojson }}
```

This template accepts the incoming body (assuming it was in JSON format) and just passes
it through unmodified.  This allows a `POST` of a partial Prefect event as in this
example:

```
POST /hooks/AERylZ_uewzpDx-8fcweHQ HTTP/1.1
Host: api.prefect.cloud
Content-Type: application/json
Content-Length: 228

{
    "event": "model.refreshed",
    "resource": {
        "prefect.resource.id": "product.models.recommendations",
        "prefect.resource.name": "Recommendations [Products]",
        "producing-team": "Data Science"
    }
}
```

The resulting event will be filled out with the default values for `occurred`, `id`, and
other fields as described [above](#event-fields-that-prefect-cloud-populates-for-you).

### Accepting CloudEvents

The [Cloud Native Computing Foundation](https://cncf.io) has standardized
[CloudEvents](https://cloudevents.io) for use by systems to exchange event information
in a common format.  These events are supported by major cloud providers and a growing
number of cloud-native systems.  Prefect Cloud can interpret a webhook containing
a CloudEvent natively with the following template:

```jinja2
{{ body|from_cloud_event(headers) }}
```

The resulting event will use the CloudEvent's `subject` as the resource (or the `source`
if no `subject` is available).  The CloudEvent's `data` attribute will become the
Prefect event's `payload['data']`, and the other CloudEvent metadata will be at
`payload['cloudevents']`.  If you would like to handle CloudEvents in a more specific
way tailored to your use case, use a dynamic template to interpret the incoming `body`.

## Troubleshooting

The initial configuration of your webhook may require some trial and error as you get
the sender and your receiving webhook speaking a compatible language.  While you are in
this phase, you may find the [Event Feed](/cloud/events/#event-feed) in the UI to be
indispensable for seeing the events as they are happening.

When Prefect Cloud encounters an error during receipt of a webhook, it will produce a
`prefect-cloud.webhook.failed` event in your workspace.  This event will include
critical information about the HTTP method, headers, and body it received, as well as
what the template rendered.  Keep an eye out for these events when something goes wrong.
