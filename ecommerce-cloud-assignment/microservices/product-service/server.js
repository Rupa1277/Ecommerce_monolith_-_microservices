const express=require('express'),cors=require('cors'),{Pool}=require('pg');
const app=express();app.use(cors(),express.json());
const db=new Pool({connectionString:process.env.DATABASE_URL});
async function ready(sql){for(let i=0;i<30;i++){try{await db.query(sql);return}catch(e){console.log('waiting for DB...');await new Promise(r=>setTimeout(r,2000))}}throw new Error('DB not reachable')}
const SEED="INSERT INTO products(name,price,description,emoji) SELECT v.* FROM (VALUES ('Laptop',55000,'14 inch, 16GB RAM','💻'),('Smartphone',20000,'5G, 128GB','📱'),('Headphones',2500,'Wireless, noise cancelling','🎧'),('Smart Watch',4000,'Fitness tracking','⌚'),('Backpack',1200,'Water resistant','🎒'),('Keyboard',1800,'Mechanical RGB','⌨️')) AS v(name,price,description,emoji) WHERE NOT EXISTS (SELECT 1 FROM products);";

// PRODUCT SERVICE (own DB: productdb)
app.get('/api/products',async(_,r)=>r.json((await db.query('SELECT * FROM products ORDER BY id')).rows));
ready('CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,name TEXT,price INT,description TEXT,emoji TEXT)')
 .then(()=>db.query(SEED)).then(()=>app.listen(3000,()=>console.log('Product service on 3000')));
