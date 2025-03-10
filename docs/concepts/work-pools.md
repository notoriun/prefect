---
description: Prefect work pools route deployment flow runs to workers. Prefect workers poll work pools for new runs to execute.
tags:
    - work pools
    - workers
    - orchestration
    - flow runs
    - deployments
    - schedules
    - concurrency limits
    - priority
search:
  boost: 2
---

# Work Pools &  Workers

Work pools and workers bridge the Prefect _orchestration environment_ with your _execution environment_. When a [deployment](/concepts/deployments/) creates a flow run, it is submitted to a specific work pool for scheduling. A worker running in the execution environment can poll its respective work pool for new runs to execute, or the work pool can submit flow runs to serverless infrastructure directly, depending on your configuration.

## Work pool overview

Work pools organize work for execution. Work pools have types corresponding to the infrastructure that will execute the flow code, as well as the delivery method of work to that environment. Pull work pools require [workers](#worker-overview) (or less ideally, [agents](#agent-overview)) to poll the work pool for flow runs to execute. [Push work pools](/guides/deployment/push-work-pools) can submit runs directly to serverless infrastructure providers like Cloud Run, Azure Container Instances, and AWS ECS without the need for an agent or worker.

!!! tip "Work pools are like pub/sub topics"
    It's helpful to think of work pools as a way to coordinate (potentially many) deployments with (potentially many) workers through a known channel: the pool itself. This is similar to how "topics" are used to connect producers and consumers in a pub/sub or message-based system. By switching a deployment's work pool, users can quickly change the worker that will execute their runs, making it easy to promote runs through environments or even debug locally.

In addition, users can control aspects of work pool behavior, like how many runs the pool allows to be run concurrently or pausing delivery entirely. These options can be modified at any time, and any workers requesting work for a specific pool will only see matching flow runs.

### Work pool configuration

You can configure work pools by using:

- Prefect CLI commands
- Prefect Python API
- Prefect UI

To manage work pools in the UI, click the **Work Pools** icon. This displays a list of currently configured work pools.

![The UI displays a list of configured work pools](/img/ui/work-pool-list.png)

You can pause a work pool from this page by using the toggle.

Select the **+** button to create a new work pool. You'll be able to specify the details for work served by this work pool.

To create a work pool via the Prefect CLI, use the `prefect work-pool create` command:

<div class="terminal">
```bash
prefect work-pool create [OPTIONS] NAME
```
</div>

`NAME` is a required, unique name for the work pool.

Optional configuration parameters you can specify to filter work on the pool include:

| Option                                             | Description                                                                                                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--paused`                                         | If provided, the work pool will be created in a paused state.                                                                                              |
| `--type`                                           | The type of infrastructure that can execute runs from this work pool. [default: prefect-agent]                                                             |
| <span class="no-wrap">`--base-job-template`</span> | The path to a JSON file containing the base job template to use. If unspecified, Prefect will use the default base job template for the given worker type. |

For example, to create a work pool called `test-pool`, you would run this command:

<div class="terminal">

```bash
$ prefect work-pool create test-pool

Created work pool with properties:
    name - 'test-pool'
    id - a51adf8c-58bb-4949-abe6-1b87af46eabd
    concurrency limit - None

Start a worker to pick up flows from the work pool:
    prefect worker start -p 'test-pool'

Inspect the work pool:
    prefect work-pool inspect 'test-pool'
```

</div>

On success, the command returns the details of the newly created work pool.

To update a work pool via the Prefect CLI, use the `prefect work-pool update` command:

<div class="terminal">
```bash
prefect work-pool update [OPTIONS] NAME
```
</div>

`NAME` is the name of the work pool to update.

Optional configuration parameters you can specify to update the work pool include:

| Option                                             | Description                                                                                                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <span class="no-wrap">`--base-job-template`</span> | The path to a JSON file containing the base job template to use. If unspecified, Prefect will use the default base job template for the given worker type. |
| `--description`                                    | A description of the work pool.                                                                                                                            |
| `--concurrency-limit`                              | The maximum number of flow runs to run simultaneously in the work pool.                                                                                    |

!!! tip "Managing work pools in CI/CD"
    You can version control your base job template by committing it as a JSON file to your repository and control updates to your work pools' base job templates by using the `prefect work-pool update` command in your CI/CD pipeline. For example, you could use the following command to update a work pool's base job template to the contents of a file named `base-job-template.json`:

    <div class="terminal">
    ```bash
    $ prefect work-pool update --base-job-template base-job-template.json my-work-pool
    ```
    </div>

#### Base job template

Each work pool has a base job template that allows the customization of the behavior of the worker executing flow runs from the work pool.

The base job template acts as a contract defining the configuration passed to the worker for each flow run and the options available to deployment creators to customize worker behavior per deployment.

A base job template comprises a `job_configuration` section and a `variables` section.

The `variables` section defines the fields available to be customized per deployment. The `variables` section follows the [OpenAPI specification](https://swagger.io/specification/), which allows work pool creators to place limits on provided values (type, minimum, maximum, etc.).

The job configuration section defines how values provided for fields in the variables section should be translated into the configuration given to a worker when executing a flow run.

The values in the `job_configuration` can use placeholders to reference values provided in the `variables` section. Placeholders are declared using double curly braces, e.g., `{{ variable_name }}`. `job_configuration` values can also be hard-coded if the value should not be customizable.

Each worker type is configured with a default base job template, making it easy to start with a work pool. The default base template defines fields that can be edited on a per-deployment basis or for the entire work pool via the Prefect API and UI.

For example, if we create a `process` work pool named 'above-ground' via the CLI:

<div class="terminal">
```bash
$ prefect work-pool create --type process above-ground
```
</div>

We see these configuration options available in the Prefect UI:
![process work pool configuration options](/img/ui/process-work-pool-config.png)

For a `process` work pool with the default base job template, we can set environment variables for spawned processes, set the working directory to execute flows, and control whether the flow run output is streamed to workers' standard output. You can also see an example of JSON formatted base job template with the 'Advanced' tab.

You can examine the default base job template for a given worker type by running:

```bash
$ prefect work-pool get-default-base-job-template --type process
{
  "job_configuration": {
    "command": "{{ command }}",
    "env": "{{ env }}",
    "labels": "{{ labels }}",
    "name": "{{ name }}",
    "stream_output": "{{ stream_output }}",
    "working_dir": "{{ working_dir }}"
  },
  "variables": {
    "type": "object",
    "properties": {
      "name": {
        "title": "Name",
        "description": "Name given to infrastructure created by a worker.",
        "type": "string"
      },
      "env": {
        "title": "Environment Variables",
        "description": "Environment variables to set when starting a flow run.",
        "type": "object",
        "additionalProperties": {
          "type": "string"
        }
      },
      "labels": {
        "title": "Labels",
        "description": "Labels applied to infrastructure created by a worker.",
        "type": "object",
        "additionalProperties": {
          "type": "string"
        }
      },
      "command": {
        "title": "Command",
        "description": "The command to use when starting a flow run. In most cases, this should be left blank and the command will be automatically generated by the worker.",
        "type": "string"
      },
      "stream_output": {
        "title": "Stream Output",
        "description": "If enabled, workers will stream output from flow run processes to local standard output.",
        "default": true,
        "type": "boolean"
      },
      "working_dir": {
        "title": "Working Directory",
        "description": "If provided, workers will open flow run processes within the specified path as the working directory. Otherwise, a temporary directory will be created.",
        "type": "string",
        "format": "path"
      }
    }
  }
}
```

You can override each of these attributes on a per-deployment basis. When deploying a flow, you can specify these overrides in the `work_pool.job_variables` section of a `deployment.yaml`.

If we wanted to turn off streaming output for a specific deployment, we could add the following to our `deployment.yaml`:

```yaml
work_pool:
    name: above-ground  
    job_variables:
        stream_output: false
```

!!! tip "Advanced Customization of the Base Job Template"
    For advanced use cases, you can create work pools with fully customizable job templates. This customization is available when creating or editing a work pool on the 'Advanced' tab within the UI or when updating a work pool via the Prefect CLI.

    Advanced customization is useful anytime the underlying infrastructure supports a high degree of customization. In these scenarios a work pool job template allows you to expose a minimal and easy-to-digest set of options to deployment authors.  Additionally, these options are the _only_ customizable aspects for deployment infrastructure, which can be useful for restricting functionality in secure environments. For example, the `kubernetes` worker type allows users to specify a custom job template that can be used to configure the manifest that workers use to create jobs for flow execution.

    For more information and advanced configuration examples, see the [Kubernetes Worker](https://prefecthq.github.io/prefect-kubernetes/worker/) documentation.

### Viewing work pools

At any time, users can see and edit configured work pools in the Prefect UI.

![The UI displays a list of configured work pools](/img/ui/work-pool-list.png)

To view work pools with the Prefect CLI, you can:

- List (`ls`) all available pools
- Inspect (`inspect`) the details of a single pool
- Preview (`preview`) scheduled work for a single pool

`prefect work-pool ls` lists all configured work pools for the server.

<div class="terminal">
```bash
$ prefect work-pool ls
prefect work-pool ls
                               Work pools
┏━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┓
┃ Name       ┃    Type        ┃                                   ID ┃ Concurrency Limit ┃
┡━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━┩
│ barbeque   │ docker         │ 72c0a101-b3e2-4448-b5f8-a8c5184abd17 │ None              │
│ k8s-pool   │ kubernetes     │ 7b6e3523-d35b-4882-84a7-7a107325bb3f │ None              │
│ test-pool  │ prefect-agent  │ a51adf8c-58bb-4949-abe6-1b87af46eabd │ None              |
| my-pool    │ process        │ cd6ff9e8-bfd8-43be-9be3-69375f7a11cd │ None              │
└────────────┴────────────────┴──────────────────────────────────────┴───────────────────┘
                       (**) denotes a paused pool
```
</div>

`prefect work-pool inspect` provides all configuration metadata for a specific work pool by ID.

<div class="terminal">
```bash
$ prefect work-pool inspect 'test-pool'
Workpool(
    id='a51adf8c-58bb-4949-abe6-1b87af46eabd',
    created='2 minutes ago',
    updated='2 minutes ago',
    name='test-pool',
    filter=None,
)
```
</div>

`prefect work-pool preview` displays scheduled flow runs for a specific work pool by ID for the upcoming hour. The optional `--hours` flag lets you specify the number of hours to look ahead.

<div class="terminal">
```bash
$ prefect work-pool preview 'test-pool' --hours 12
┏━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Scheduled Star… ┃ Run ID                     ┃ Name         ┃ Deployment ID               ┃
┡━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ 2022-02-26 06:… │ 741483d4-dc90-4913-b88d-0… │ messy-petrel │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-26 05:… │ 14e23a19-a51b-4833-9322-5… │ unselfish-g… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-26 04:… │ deb44d4d-5fa2-4f70-a370-e… │ solid-ostri… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-26 03:… │ 07374b5c-121f-4c8d-9105-b… │ sophisticat… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-26 02:… │ 545bc975-b694-4ece-9def-8… │ gorgeous-mo… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-26 01:… │ 704f2d67-9dfa-4fb8-9784-4… │ sassy-hedge… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-26 00:… │ 691312f0-d142-4218-b617-a… │ sincere-moo… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-25 23:… │ 7cb3ff96-606b-4d8c-8a33-4… │ curious-cat… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-25 22:… │ 3ea559fe-cb34-43b0-8090-1… │ primitive-f… │ 156edead-fe6a-4783-a618-21… │
│ 2022-02-25 21:… │ 96212e80-426d-4bf4-9c49-e… │ phenomenal-… │ 156edead-fe6a-4783-a618-21… │
└─────────────────┴────────────────────────────┴──────────────┴─────────────────────────────┘
                                   (**) denotes a late run
```
</div>

### Work Pool Status

Work pools have three statuses: `READY`, `NOT_READY`, and `PAUSED`. A work pool is considered ready if it has at least one online worker sending heartbeats to the work pool. If a work pool has no online workers, it is considered not ready to execute work. A work pool can be placed in a paused status manually by a user or via an automation. When a paused work pool is unpaused, it will be reassigned the appropriate status based on whether any workers are sending heartbeats.

### Pausing and deleting work pools

A work pool can be paused at any time to stop the delivery of work to workers. Workers will not receive any work when polling a paused pool.

To pause a work pool through the Prefect CLI, use the `prefect work-pool pause` command:

<div class="terminal">
```bash
$ prefect work-pool pause 'test-pool'
Paused work pool 'test-pool'
```
</div>

To resume a work pool through the Prefect CLI, use the `prefect work-pool resume` command with the work pool name.

To delete a work pool through the Prefect CLI, use the `prefect work-pool delete` command with the work pool name.

### Managing concurrency

Each work pool can optionally restrict concurrent runs of matching flows.

For example, a work pool with a concurrency limit of 5 will only release new work if fewer than 5 matching runs are currently in a `Running` or `Pending` state. If 3 runs are `Running` or `Pending`, polling the pool for work will only result in 2 new runs, even if there are many more available, to ensure that the concurrency limit is not exceeded.

When using the `prefect work-pool` Prefect CLI command to configure a work pool, the following subcommands set concurrency limits:

- `set-concurrency-limit`  sets a concurrency limit on a work pool.
- `clear-concurrency-limit` clears any concurrency limits from a work pool.

### Work queues

!!! tip "Advanced topic"
    Work queues do not require manual creation or configuration, because Prefect will automatically create them whenever needed. Managing work queues offers advanced control over how runs are executed.

Each work pool has a "default" queue that all work will be sent to by default. Additional queues can be added to a work pool. Work queues enable greater control over work delivery through fine grained priority and concurrency. Each work queue has a priority indicated by a unique positive integer. Lower numbers take greater priority in the allocation of work. Accordingly, new queues can be added without changing the rank of the higher-priority queues (e.g. no matter how many queues you add, the queue with priority `1` will always be the highest priority).

Work queues can also have their own concurrency limits. Note that each queue is also subject to the global work pool concurrency limit, which cannot be exceeded.

Together work queue priority and concurrency enable precise control over work. For example, a pool may have three queues: A "low" queue with priority `10` and no concurrency limit, a "high" queue with priority `5` and a concurrency limit of `3`, and a "critical" queue with priority `1` and a concurrency limit of `1`. This arrangement would enable a pattern in which there are two levels of priority, "high" and "low" for regularly scheduled flow runs, with the remaining "critical" queue for unplanned, urgent work, such as a backfill.

Priority is evaluated to determine the order in which flow runs are submitted for execution.
If all flow runs are capable of being executed with no limitation due to concurrency or otherwise, priority is still used to determine order of submission, but there is no impact to execution.
If not all flow runs can be executed, usually as a result of concurrency limits, priority is used to determine which queues receive precedence to submit runs for execution.

Priority for flow run submission proceeds from the highest priority to the lowest priority. In the preceding example, all work from the "critical" queue (priority 1) will be submitted, before any work is submitted from "high" (priority 5). Once all work has been submitted from priority queue "critical", work from the "high" queue will begin submission.

If new flow runs are received on the "critical" queue while flow runs are still in scheduled on the "high" and "low" queues, flow run submission goes back to ensuring all scheduled work is first satisfied from the highest priority queue, until it is empty, in waterfall fashion.

### Local debugging

As long as your deployment's infrastructure block supports it, you can use work pools to temporarily send runs to a worker running on your local machine for debugging by running `prefect worker start -p my-local-machine` and updating the deployment's work pool to `my-local-machine`.

## Worker overview

Workers are lightweight polling services that retrieve scheduled runs from a work pool and execute them.

Workers are similar to agents, but offer greater control over infrastructure configuration and the ability to route work to specific types of execution environments.

Workers each have a type corresponding to the execution environment to which they will submit flow runs. Workers are only able to join work pools that match their type. As a result, when deployments are assigned to a work pool, you know in which execution environment scheduled flow runs for that deployment will run.

### Worker types

Below is a list of available worker types. Note that most worker types will require installation of an additional package.

| Worker Type | Description | Required Package |
| --- | --- | --- |
| [`process`](/api-ref/prefect/workers/process/) | Executes flow runs in subprocesses | |
| [`kubernetes`](https://prefecthq.github.io/prefect-kubernetes/worker/) | Executes flow runs as Kubernetes jobs | `prefect-kubernetes` |
| [`docker`](https://prefecthq.github.io/prefect-docker/worker/) | Executes flow runs within Docker containers | `prefect-docker` |
| [`ecs`](https://prefecthq.github.io/prefect-aws/ecs_worker/) | Executes flow runs as ECS tasks | `prefect-aws` |
| [`cloud-run`](https://prefecthq.github.io/prefect-gcp/cloud_run_worker/) | Executes flow runs as Google Cloud Run jobs | `prefect-gcp` |
| [`vertex-ai`](https://prefecthq.github.io/prefect-gcp/vertex_worker/) | Executes flow runs as Google Cloud Vertex AI jobs | `prefect-gcp` |
| [`azure-container-instance`](https://prefecthq.github.io/prefect-azure/container_instance_worker/) | Execute flow runs in ACI containers | `prefect-azure` |

If you don’t see a worker type that meets your needs, consider [developing a new worker type](/guides/deployment/developing-a-new-worker-type/)!

### Worker options

Workers poll for work from one or more queues within a work pool. If the worker references a work queue that doesn't exist, it will be created automatically. The worker CLI is able to infer the worker type from the work pool. Alternatively, you can also specify the worker type explicitly. If you supply the worker type to the worker CLI, a work pool will be created automatically if it doesn't exist (using default job settings).

Configuration parameters you can specify when starting a worker include:

| Option                                            | Description                                                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--name`, `-n`                                    | The name to give to the started worker. If not provided, a unique name will be generated.                                                   |
| `--pool`, `-p`                                    | The work pool the started worker should poll.                                                                                               |
| `--work-queue`, `-q`                              | One or more work queue names for the worker to pull from. If not provided, the worker will pull from all work queues in the work pool.      |
| `--type`, `-t`                                    | The type of worker to start. If not provided, the worker type will be inferred from the work pool.                                          |
| <span class="no-wrap">`--prefetch-seconds`</span> | The amount of time before a flow run's scheduled start time to begin submission. Default is the value of `PREFECT_WORKER_PREFETCH_SECONDS`. |
| `--run-once`                                      | Only run worker polling once. By default, the worker runs forever.                                                                          |
| `--limit`, `-l`                                   | The maximum number of flow runs to start simultaneously.                                                                                    |
| `--with-healthcheck`                                   | Start a healthcheck server for the worker.                                                                                    |
| `--install-policy`                                   | Install policy to use workers from Prefect integration packages.                                                                                    |

You must start a worker within an environment that can access or create the infrastructure needed to execute flow runs. The worker will deploy flow runs to the infrastructure corresponding to the worker type. For example, if you start a worker with type `kubernetes`, the worker will deploy flow runs to a Kubernetes cluster.

!!! tip "Prefect must be installed in execution environments"
    Prefect must be installed in any environment (virtual environment, Docker container, etc.) where you intend to run the worker or execute a flow run.

!!! tip "`PREFECT_API_URL` and `PREFECT_API_KEY`settings for workers"
    `PREFECT_API_URL` must be set for the environment in which your worker is running. You must also have a user or service account with the `Worker` role, which can be configured by setting the `PREFECT_API_KEY`.

### Worker status

Workers have two statuses: `ONLINE` and `OFFLINE`. A worker is online if it sends regular heartbeat messages to the Prefect API. If a worker has missed three heartbeats, it is considered offline. By default, a worker is considered offline a maximum of 90 seconds after it stopped sending heartbeats, but the threshold can be configured via the `PREFECT_WORKER_HEARTBEAT_SECONDS` setting.

### Starting a worker

Use the `prefect worker start` CLI command to start a worker. You must pass at least the work pool name. If the work pool does not exist, it will be created if the `--type` flag is used.
<div class="terminal">
```bash
$ prefect worker start -p [work pool name]
```
</div>
For example:
<div class="terminal">
```bash
prefect worker start -p "my-pool"
Discovered worker type 'process' for work pool 'my-pool'.
Worker 'ProcessWorker 65716280-96f8-420b-9300-7e94417f2673' started!
```
</div>
In this case, Prefect automatically discovered the worker type from the work pool.
To create a work pool and start a worker in one command, use the `--type` flag:
<div class="terminal">
```bash
prefect worker start -p "my-pool" --type "process"
Worker 'ProcessWorker d24f3768-62a9-4141-9480-a056b9539a25' started!
06:57:53.289 | INFO    | prefect.worker.process.processworker d24f3768-62a9-4141-9480-a056b9539a25 - Worker pool 'my-pool' created.
```
</div>
In addition, workers can limit the number of flow runs they will start simultaneously with the `--limit` flag.
For example, to limit a worker to five concurrent flow runs:
<div class="terminal">
```bash
prefect worker start --pool "my-pool" --limit 5
```
</div>

### Configuring prefetch

By default, the worker begins submitting flow runs a short time (10 seconds) before they are scheduled to run. This behavior allows time for the infrastructure to be created so that the flow run can start on time.

In some cases, infrastructure will take longer than 10 seconds to start the flow run. The prefetch can be increased using the `--prefetch-seconds` option or the `PREFECT_WORKER_PREFETCH_SECONDS` setting.

If this value is _more_ than the amount of time it takes for the infrastructure to start, the flow run will _wait_ until its scheduled start time.

### Polling for work

Workers poll for work every 15 seconds by default. This interval is configurable in your [profile settings](/concepts/settings/) with the
`PREFECT_WORKER_QUERY_SECONDS` setting.

### Install policy

The Prefect CLI can install the required package for Prefect-maintained worker types automatically. You can configure this behavior with the `--install-policy` option. The following are valid install policies

| Install Policy | Description |
| --- | --- |
| `always` | Always install the required package. Will update the required package to the most recent version if already installed. |
| <span class="no-wrap">`if-not-present`<span> | Install the required package if it is not already installed. |
| `never` | Never install the required package. |
| `prompt` | Prompt the user to choose whether to install the required package. This is the default install policy. If `prefect worker start` is run non-interactively, the `prompt` install policy will behave the same as `never`. |

### Additional resources

- [How to run a Prefect 2 worker as a systemd service on Linux](https://discourse.prefect.io/t/how-to-run-a-prefect-2-worker-as-a-systemd-service-on-linux/1450)
