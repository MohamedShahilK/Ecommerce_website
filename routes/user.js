const e = require('express');
var express = require('express');
var router = express.Router();


const prodHelp = require('../db_helpers/product_Helper')
const userHelp = require('../db_helpers/user_Helper')

const verifyLogin = (req, res, next) => {

  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/', verifyLogin, function (req, res, next) {

  let cartCount = 0
  console.log(cartCount);
  //Here we are not passing any parameter.We using callback instead of promise
  prodHelp.getAllProducts(async(prod) => {

    if(prod){
      cartCount = await userHelp.getCartCount(req.session.user._id)
    }
    res.render('user/view-products', { prod, user: req.session.user, cartCount });
  })
});

router.get('/signup', (req, res) => {

  res.render('user/signup')
})

router.post('/signup', (req, res) => {

  userHelp.userSignup(req.body).then((user) => {

    req.session.loggedIn = true
    req.session.user = user
    res.redirect('/')
  })
})

router.get('/login', (req, res) => {

  if (req.session.loggedIn) {
    res.redirect('/')
  } else {

    res.render('user/login', { loginErr: req.session.loginErr })
    req.session.loginErr = null
  }

})

router.post('/login', (req, res) => {

  userHelp.userLogin(req.body).then((response) => {

    if (response.status) {

      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {

      req.session.loginErr = "Username or Password is wrong"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {

  req.session.destroy()
  res.redirect('/login')
})

router.get('/add-to-cart/:proid', verifyLogin, async (req, res) => {

  userHelp.addToCart(req.params.proid, req.session.user._id).then(() => {
    // res.redirect('/')
    res.json({ status: true })
  })

})

router.get('/cart', verifyLogin, async (req, res) => {

  let products = await userHelp.getProductsToCart(req.session.user._id)
  let cartCount = await userHelp.getCartCount(req.session.user._id)

  if (products.length > 0) {
    let total = await userHelp.getTotalAmt(req.session.user._id)
    res.render('user/cart', { user: req.session.user, products, cartCount, total })
  } else { res.render('user/cart', { user: req.session.user }) }

  // console.log(products);

})


//Without Ajax
// router.get('/cartPdtRemove/:proId',verifyLogin,async (req,res)=>{

//   let prodId = req.params.proId
//   userHelp.cartPdtRemove(req.session.user._id, prodId).then(()=>{
//     res.redirect('/cart')
//   })
// })

//With Ajax(Get)
// router.get('/cartPdtRemove/:proId',verifyLogin,async (req,res)=>{

//   let prodId = req.params.proId
//   userHelp.cartPdtRemove(req.session.user._id, prodId).then(()=>{
//     res.json({status : true})
//   })
// })

//With Ajax(Post)
// router.post('/cartPdtRemove/:proid',async (req,res)=>{

//   userHelp.cartPdtRemove(req.body).then(()=>{
//     // console.log(req.body);
//     res.json({status : true})
//   })
// })
router.post('/cartPdtRemove', async (req, res) => {

  userHelp.cartPdtRemove(req.body).then(() => {
    // console.log(req.body);
    res.json({ status: true })
  })
})

router.post('/change-quantity', (req, res, next) => {

  userHelp.changeQuantity(req.body).then(async (response) => {

    response.total = await userHelp.getTotalAmt(req.body.userId)//In ajax, we cannot use 'session'
    // console.log(req.body.count);
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {

  let total = await userHelp.getTotalAmt(req.session.user._id)
  res.render('user/place-order', { user: req.session.user, total })
})

router.post('/place-order', verifyLogin, async (req, res) => {

  let cartProducts = await userHelp.getCartProductList(req.body.userId) //hidden userId in place-order.hbs
  // console.log(cartProducts);
  let total = await userHelp.getTotalAmt(req.body.userId)

  userHelp.placeOrder(req.body, cartProducts, total).then((orderId) => {

    if (req.body['payment-method'] === 'COD') {

      // res.json({ status: true })
      res.json({ codStatus: true })
    } else {

      //creating instance of razorpay for every payment(not only once) 
      //(instance must be create in server side) 
      //then we call(apicall) it from client side

      userHelp.generateRazorpay(orderId, total).then((order) => {

        //It already contain a status varaible
        res.json(order)
      })
    }

  })
})

router.get('/ordersucess', (req, res) => {

  res.render('user/ordersucess')
})

router.get('/orders', verifyLogin, async (req, res) => {

  let orders = await userHelp.getUserOrders(req.session.user._id)
  // console.log(orders);
  res.render('user/orders', { orders })
})

router.get('/view-order-products/:orderId', verifyLogin, async (req, res) => {

  let products = await userHelp.getViewOrderProducts(req.params.orderId)

  res.render('user/viewOrderProduct', { products })
})

router.post('/verifypayment', (req, res) => {

  console.log(req.body);
  userHelp.verifyPayment(req.body).then(() => {
    userHelp.changePaymentStatus(req.body['order[receipt]']).then(() => {

      res.json({ status: true })
    })
  }).catch((err) => {

    console.log(err);
    res.json({ status: false })
  })
})

module.exports = router;
