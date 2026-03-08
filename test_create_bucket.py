import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    's3',
    endpoint_url=os.getenv('R2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    region_name=os.getenv('R2_REGION', 'auto')
)

bucket_name = os.getenv('R2_BUCKET')

try:
    s3.create_bucket(Bucket=bucket_name)
    print(f"Successfully created bucket: {bucket_name}")
except Exception as e:
    print(f"Failed to create bucket: {e}")
