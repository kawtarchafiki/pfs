import React, { useEffect, useState } from "react";
import './ListProduct.css'
import cross_icon from '../../assets/cross_icon.png'

const ListProduct = ()=>{

  const [allproducts,setAllProducts]=useState([]);
  const [searchValue, setSearchValue] = useState('');

  const fetchInfo = async ()=>{
    await fetch('http://localhost:4000/allproducts')
      .then((res)=>res.json())
      .then((data)=>{
        setAllProducts(data)
      });
  }

  useEffect(()=>{
    fetchInfo();
  },[])

  const remove_product= async(id)=>{
    await fetch('http://localhost:4000/removeproduct',{
      method:'POST',
      headers:{
        Accept:'application/json',
        'Content-Type':'application/json',
      },
      body:JSON.stringify({id:id})
    })
    await fetchInfo();
  }

  // Fonction de gestion de la recherche
  const handleSearch = (event) => {
    setSearchValue(event.target.value);
  }

  // Filtrer les produits en fonction de la recherche
  const filteredProducts = allproducts.filter(product =>
    product.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return(
    <div className="ListProduct ">
      <h1>All Products List</h1>

      {/* Champ de recherche */}
      <input 
        type="text" 
        placeholder="Search products..." 
        value={searchValue} 
        onChange={handleSearch} 
      />

      <div className="listproduct-main-format">
        <p>Products</p>
        <p>Title</p>
        <p>Old Price</p>
        <p>New Price</p>
        <p>Category</p>
        <p>Remove</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {filteredProducts.map((product,index)=>{
          return (
            <div key={index} className="listproduct-main-format listproduct-format " >
              <img src={product.image} alt="" className="listproduct-image" />
              <p>{product.name}</p>
              <p>${product.old_price}</p>
              <p>${product.new_price}</p>
              <p>{product.category}</p>
              <img onClick={()=>{remove_product(product.id)}} className="listproduct-remove-icon" src={cross_icon} alt="" />
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default ListProduct
