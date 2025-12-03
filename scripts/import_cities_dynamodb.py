import csv
import boto3
from decimal import Decimal
import math

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("cities")

# Convert empty string to None, and convert number string to Decimal
def convert_value(value):
  if value == "":
    return None
  try:
    num = float(value)
    if math.isnan(num) or math.isinf(num):
      return None
    return Decimal(str(num))
  except ValueError:
    return value

# Import data from CSV file to DynamoDB
def import_file(file_path):
  with open(file_path, newline="", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)
    with table.batch_writer() as batch:
      for row in reader:
        item = {}
        for k, v in row.items():
          item[k] = convert_value(v)
        item["search_name_short"] = item["name"][:2].lower() if item["name"] else ""
        item["search_name"] = item["name"].lower() if item["name"] else ""
        item["id"] = Decimal(str(item["id"]))
        item["name"] = str(item["name"])
        batch.put_item(Item=item)

# Update cities table to add search_name attribute
def update_cities():
  response = table.scan()
  for item in response["Items"]:
    table.update_item(
      Key={
        "name": str(item["name"]),
        "id": Decimal(str(item["id"]))
      },
      UpdateExpression="SET search_name_short = :sns, search_name = :sn",
      ExpressionAttributeValues={
        ":sns": item["name"][:2].lower(),
        ":sn": item["name"].lower()
      }
    )
    
if __name__ == "__main__":
  import_file('src/assets/cities15000.csv')
  print("Data imported.")