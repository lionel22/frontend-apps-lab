#!/bin/sh

set -eu

IMAGE_NAME="${TRADER_FRONTEND_IMAGE_NAME:-trader-frontend}"
IMAGE_TAG="${TRADER_FRONTEND_IMAGE_TAG:-dev}"
IMAGE_PLATFORM="${TRADER_FRONTEND_IMAGE_PLATFORM:-linux/amd64}"
DOCKERFILE="${TRADER_FRONTEND_DOCKERFILE:-apps/trader/Dockerfile}"
BUILD_CONTEXT="${TRADER_FRONTEND_BUILD_CONTEXT:-.}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

cd "$REPO_ROOT"

docker buildx build \
  -f "$DOCKERFILE" \
  --platform "$IMAGE_PLATFORM" \
  --tag "$IMAGE_NAME:$IMAGE_TAG" \
  --push \
  "$BUILD_CONTEXT"
