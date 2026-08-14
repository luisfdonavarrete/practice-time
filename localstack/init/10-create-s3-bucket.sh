#!/bin/sh
set -eu

awslocal s3api head-bucket --bucket "${S3_BUCKET}" 2>/dev/null ||
  awslocal s3api create-bucket --bucket "${S3_BUCKET}"
