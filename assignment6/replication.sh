#!/bin/bash
# Two-way sync between the 3 service DBs using PostgreSQL logical replication.
# Each DB OWNS one table (writes only there) and receives copies of the other two tables.
#   Phase 1 (run on all 3 DB VMs):  bash replication.sh pub <product|cart|payment>
#   Phase 2 (run on all 3 DB VMs):  bash replication.sh sub <product|cart|payment> <PRODUCT_IP> <CART_IP> <PAYMENT_IP>
PHASE=$1; ROLE=$2; P=$3; C=$4; Y=$5
case $ROLE in
  product) DB=productdb; OWN=products;;
  cart)    DB=cartdb;    OWN=cart;;
  payment) DB=paymentdb; OWN=orders;;
  *) echo "role must be product|cart|payment"; exit 1;;
esac
q(){ sudo docker exec -i shop-db psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -c "$1"; }
conn(){ echo "host=$1 port=5432 dbname=$2 user=postgres password=pass"; }

if [ "$PHASE" = "pub" ]; then
  q "CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,name TEXT,price INT,description TEXT,emoji TEXT)"
  q "CREATE TABLE IF NOT EXISTS cart(id SERIAL PRIMARY KEY,product_id INT,name TEXT,price INT,qty INT)"
  q "CREATE TABLE IF NOT EXISTS orders(id SERIAL PRIMARY KEY,customer TEXT,total INT,created_at TIMESTAMP DEFAULT now())"
  q "CREATE PUBLICATION ${ROLE}_pub FOR TABLE $OWN"
elif [ "$PHASE" = "sub" ]; then
  if [ "$ROLE" != product ]; then q "CREATE SUBSCRIPTION ${ROLE}_from_product CONNECTION '$(conn $P productdb)' PUBLICATION product_pub"; fi
  if [ "$ROLE" != cart ];    then q "CREATE SUBSCRIPTION ${ROLE}_from_cart CONNECTION '$(conn $C cartdb)' PUBLICATION cart_pub"; fi
  if [ "$ROLE" != payment ]; then q "CREATE SUBSCRIPTION ${ROLE}_from_payment CONNECTION '$(conn $Y paymentdb)' PUBLICATION payment_pub"; fi
else
  echo "usage: see top of file"; exit 1
fi
