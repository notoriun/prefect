---
description: Learn how to use Prefect to schedule work on serverless infrastructure that depends on a worker.
tags:
    - work pools
    - deployments
    - Cloud Run
    - GCP
    - Vertex AI
    - AWS ECS
    - Azure Container Instances
    - ACI
search:
  boost: 2
---

# Run Deployments on Serverless Infrastructure with Prefect Workers

Prefect provides work pools for workers to run workflows on the serverless platforms of major cloud providers.
The following options are available:

- AWS Elastic Container Service (ECS)
- Azure Container Instances (ACI)
- Google Cloud Run
- Google Vertex AI

![Work pool options](/img/ui/work-pools.png)

- Create a work pool that sends work to your chosen serverless infrastructure
- Deploy a flow to that work pool
- Start a worker in your serverless cloud provider that will poll its matched work pool for scheduled runs
- Schedule a deployment run that a worker will pick up from the work pool and run on your serverless infrastructure

!!! note "Push work pools don't require a worker"
    Options for push work pool versions of AWS ECS, Azure Container Instances, and Google Cloud Run that do not require a worker are available with Prefect Cloud.
    These push work pool options require connection configuration information to be stored on Prefect Cloud.
    Read more in the [Serverless Push Work Pool Guide](/guides/deployment/push-work-pools/).

This is a brief overview of the options to run workflows on serverless infrastructure.
For in-depth guides, see the Prefect integration libraries:

- [AWS ECS guide in the `prefect-aws` docs](https://prefecthq.github.io/prefect-aws/ecs_guide/)
- Azure Container Instances guide (forthcoming)
- [Google Cloud Run guide in the `prefect-gcp` docs](https://prefecthq.github.io/prefect-gcp/gcp-worker-guide/).
- For Google Vertex AI, follow the Cloud Run guide, substituting *Google Vertex AI* where *Google Cloud Run* is mentioned.

!!! note "Choosing between Google Cloud Run and Google Vertex AI"
    Google Vertex AI is well-suited for machine learning model training applications in which GPUs or TPUs and high resource levels are desired.

## Steps

1. Make sure you have an user or service account on your chosen cloud provider with the necessary permissions to run serverless jobs
1. Create the appropriate serverless work pool that uses a worker in the Prefect UI
1. Create a deployment that references the work pool
1. Start a worker in your chose serverless cloud provider infrastructure
1. Run the deployment

## Next steps

Options for push versions on AWS ECS, Azure Container Instances, and Google Cloud Run work pools that do not require a worker are available with Prefect Cloud.
Read more in the [Serverless Push Work Pool Guide](/guides/deployments/push-work-pools/).

Learn more about workers and work pools in the [Prefect concept documentation](/concepts/work-pools/).
