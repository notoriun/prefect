---
description: Learn how to do common workflows with Prefect.
title: Guides
tags:
    - guides
    - how to
search:
  boost: 2
---

# Guides

This section of the documentation contains guides for common workflows and use cases.

## Development

| Title                                                  | Description                                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Hosting](/guides/host/) | Host your own Prefect server instance. |
| [Profiles & Settings](/guides/settings/) | Configure Prefect and save your settings. |
| [Testing](/guides/testing/) | Easily test your workflows. |
| [Global Concurrency Limits](/guides/global-concurrency-limits/) | Limit flow runs. |
| [Runtime Context](/guides/runtime-context/) | Enable a flow to access metadata about itself and its context when it runs.  |
| [Variables](/guides/variables/) | Store and retrieve configuration data. |
| [Prefect Client](/guides/using-the-client/) | Use `PrefectClient` to interact with the API server. |
| [Webhooks](/guides/webhooks/) | Receive, observe, and react to events from other systems. |
| [Terraform Provider](https://registry.terraform.io/providers/PrefectHQ/prefect/latest/docs/guides/getting-started) | Use the Terraform Provider for Prefect Cloud for infrastructure as code. |
| [Prefect Recipes](/recipes/recipes/) |  Common, extensible examples for setting up Prefect. |

## Execution

| Title                                                  | Description                                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Docker](/guides/docker/) | Deploy flows with Docker containers. |
| [State Change Hooks](/guides/state-change-hooks/) | Execute code in response to state changes. |
| [Dask and Ray](/guides/dask-ray-task-runners/) | Scale your flows with parallel computing frameworks. |
| [Moving Data](/guides/moving-data/) | Move data to and from cloud providers.  |
| [Logging](/guides/logs/) | Configure Prefect's logger and aggregate logs from other tools. |
| [Troubleshooting](/guides/troubleshooting/) | Identify and resolve common issues with Prefect. |

## Workers and agents

| Title                                                  | Description                                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Deploying Flows to Work Pools and Workers](/guides/prefect-deploy/) | Learn how to run you code with dynamic infrastructure. |
| [Upgrade from Agents to Workers](/guides/upgrade-guide-agents-to-workers/) | Why and how to upgrade from agents to workers. |
| [Storage](/guides/deployment/storage-guide/) | Store your code for deployed flows. |
| [Kubernetes](/guides/deployment/kubernetes/) | Deploy flows on Kubernetes. |
| [Serverless Push Work Pools](/guides/deployment/push-work-pools/) | Run flows on serverless infrastructure without a worker. |
| [Serverless Work Pools with Workers](/guides/deployment/serverless-workers/) | Run flows on serverless infrastructure with a worker. |
| [Daemonize Processes](/guides/deployment/daemonize/) | Set up a systemd service to run a Prefect worker or .serve process. |
| [Custom Workers](/guides/deployment/developing-a-new-worker-type/) | Develop your own worker type. |

!!! tip "Need help?"
    Get your questions answered by a Prefect Product Advocate! [Book a Meeting](https://calendly.com/prefect-experts/prefect-product-advocates?utm_campaign=prefect_docs_cloud&utm_content=prefect_docs&utm_medium=docs&utm_source=docs)
