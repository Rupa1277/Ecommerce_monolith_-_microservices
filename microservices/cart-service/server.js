const express=require('express'),cors=require('cors'),{Pool}=require('pg');
const app=express();app.use(cors(),express.json());
const db=new Pool({connectionString:process.env.DATABASE_URL});
async function ready(sql){for(let i=0;i<30;i++){try{await db.query(sql);return}catch(e){console.log('waiting for DB...');await new Promise(r=>setTimeout(r,2000))}}throw new Error('DB not reachable')}
const SEED="INSERT INTO products(name,price,description,emoji) SELECT v.* FROM (VALUES ('Laptop',55000,'14 inch, 16GB RAM','💻'),('Smartphone',20000,'5G, 128GB','📱'),('Headphones',2500,'Wireless, noise cancelling','🎧'),('Smart Watch',4000,'Fitness tracking','⌚'),('Backpack',1200,'Water resistant','🎒'),('Keyboard',1800,'Mechanical RGB','⌨️')) AS v(name,price,description,emoji) WHERE NOT EXISTS (SELECT 1 FROM products);";

// CART SERVICE (own DB: cartdb)
app.get('/api/cart',async(_,r)=>r.json((await db.query('SELECT * FROM cart ORDER BY id')).rows));
app.post('/api/cart',async(q,r)=>{
  const {product_id,name,price}=q.body;
  const u=await db.query('UPDATE cart SET qty=qty+1 WHERE product_id=$1 RETURNING *',[product_id]);
  if(!u.rowCount)await db.query('INSERT INTO cart(product_id,name,price,qty) VALUES($1,$2,$3,1)',[product_id,name,price]);
  r.json({ok:true});
});
app.delete('/api/cart',async(_,r)=>{await db.query('DELETE FROM cart');r.json({ok:true})});
app.delete('/api/cart/:id',async(q,r)=>{await db.query('DELETE FROM cart WHERE id=$1',[q.params.id]);r.json({ok:true})});
ready('CREATE TABLE IF NOT EXISTS cart(id SERIAL PRIMARY KEY,product_id INT,name TEXT,price INT,qty INT)')
 .then(()=>app.listen(3000,()=>console.log('Cart service on 3000')));
