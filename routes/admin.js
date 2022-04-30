var express = require('express');
var router = express.Router();

// const fs = require('fs')

const prodHelp = require('../db_helpers/product_Helper')

router.get('/', function (req, res, next) {
  prodHelp.getAllProducts((prod) => {

    res.render('admin/view-products', { admin: true, prod })
  })

});

router.get('/addproduct', (req, res) => {
  res.render('admin/add-product', { admin: true })
})

router.post('/addproduct', (req, res) => {
  // console.log(req.body);
  // console.log(req.files.image);
  prodHelp.add_product_to_database(req.body, (id) => {
    // console.log(id);

    let image = req.files.image
    let uploadPath = './public/product-images/' + id + '.jpg'
    image.mv(uploadPath, (err, done) => {
      if (!err) {
        res.render('admin/add-product', { admin: true })
        // res.redirect('/addproduct', { admin: true })
      } else {
        console.log(err);
      }
    })
  })
})

router.get("/delete-product/:proId", (req, res) => {

  let prodId = req.params.proId
  prodHelp.deleteProduct(prodId).then(() => {

    // const path = './public/product-images/' + prodId + '.jpg'
    // try {
    //   fs.unlinkSync(path)
    //   console.log("Deleted")
    // } catch (err) {
    //   console.error(err)
    // }

    res.redirect('/admin')
  })
})

router.get('/edit-product/:proid', async (req, res) => {

  let prodId = req.params.proid
  let product = await prodHelp.getProductDetails(prodId)
  res.render('admin/edit-product', { product, admin: true })
})

router.post('/edit-product/:proid', (req, res) => {

  let prodId = req.params.proid
  prodHelp.editProduct(prodId, req.body).then(() => {
    res.redirect('/admin')

    if ((req.files && req.files.image)){
      let image = req.files.image
      image.mv('./public/product-images/'+ prodId + '.jpg')
    }
  })
})


module.exports = router;
