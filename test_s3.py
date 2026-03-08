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

try:
    s3.put_object(Bucket=os.getenv('R2_BUCKET'), Key='test_upload.txt', Body=b'hello world')
    print("Upload successful!")
except Exception as e:
    print(f"Upload failed: {e}")
