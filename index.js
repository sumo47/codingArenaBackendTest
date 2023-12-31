const express = require("express");
const app = express();
const port = 3001;
const ConnectToMongo = require("./db");
const User = require("./User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("./Order");
const multer = require("multer");
const Course = require("./Course.js");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static("uploads"));

ConnectToMongo();

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// Combine signup and verifyemail into a single route
app.post("/signup", async (req, res) => {
	const { username, email, password } = req.body;
	let success = false;

	// Check if the email is already registered
	let user = await User.findOne({ email: email });
	if (user) {
		res.json({
			success: success,
			error:
				"Your email is already registered. Login or register with another email.",
		});
	} else if (password.length < 8) {
		res.json({
			success: success,
			error: "Password must contain at least 8 characters.",
		});
	} else {
		// Generate a random OTP
		const num = Math.floor(Math.random() * 90000) + 10000;

		// Send the verification email with the OTP
		sendVerificationEmail(email, num);

		// Hash the password
		let salt = await bcrypt.genSaltSync(10);
		let hash = await bcrypt.hashSync(password, salt);

		// Create a new user with hashed password and unverified status
		const newUser = await User.create({
			username: username,
			email: email,
			password: hash,
			isVerified: false,
			otp: num,
		});

		const data = {
			user: {
				id: newUser.id,
				email: newUser.email,
			},
		};

		success = true;
		var token = jwt.sign(data, "secret123");

		res.json({ success: success, token: token, otp: num });
	}
});

//login
app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	if ((email == "admin@email.com", password == "admin123")) {
		const data = {
			user: {
				email: email,
				admin: true,
			},
		};
		var token = jwt.sign(data, "secret123");
		res.json({ success: true, token: token, admin: true });
	}
	let success = false;
	let user = await User.findOne({ email: email });
	if (user) {
		const passwordCompare = await bcrypt.compare(password, user.password);
		if (passwordCompare) {
			const data = {
				user: {
					id: user.id,
					email: user.email,
				},
			};
			success = true;
			var token = jwt.sign(data, "secret123");
			res.json({ success: success, token: token, admin: false });
		} else {
			res.json({ success: success, error: "Invalid Email or Password " });
		}
	} else {
		res.json({ success: success, error: "No user Exists with this email Id " });
	}
});

// Email sending function
const sendVerificationEmail = (email, otp) => {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "jaisidhu2004@gmail.com",
			pass: "hxka ppay weeg qoxd",
		},
	});

	const mailOptions = {
		from: "jaisidhu2004@gmail.com",
		to: email,
		subject: "Coding Arena - Verification OTP",
		text: otp.toString(),
	};

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log("Email sent with OTP: " + info.response);
		}
	});
};

// Verify OTP
app.post("/verifyotp", async (req, res) => {
	const { email, otp } = req.body;

	try {
		console.log("Received OTP verification request:", { email, otp });

		// Find the user with the given email and OTP in the database
		const user = await User.findOne(email, otp);

		if (user) {
			// Update the user's 'isVerified' status in the database
			const updateResult = await User.updateOne(
				{ otp: otp },
				{ $set: { isVerified: true } }
			);

			console.log("User found and updated:", updateResult);

			return res.json({ success: true, message: "OTP verified successfully." });
		}
	} catch (error) {
		console.error("Error verifying OTP:", error);
		res.json({
			success: false,
			error: "An error occurred during OTP verification.",
		});
	}

	// If the OTP verification fails, return an error message
	console.log("OTP verification failed");
	res.json({ success: false, error: "Invalid OTP or user not found." });
});

//CART SYSTEM

const cartItemSchema = new mongoose.Schema({
	title: String,
	cname: String,
	price: Number,
	image: String,
  });

  const CartItem = mongoose.model('CartItem', cartItemSchema);

//get all courses
app.get('/allcourses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



//add course to cart
app.post('/cart/add', async (req, res) => {
  try {
    const courseTitle = req.body.courseTitle; 

    const course = await Course.findOne({ title: courseTitle });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const cartItem = new CartItem(
		{   title: courseTitle, 
		   cname: course.cname,
		   price: course.price, 
		   image: course.image, });
  
	  // Save the cart item to the database
	  await cartItem.save();
  
	  res.json({ message: 'Course added to cart', cartItem });
	} catch (error) {
	  console.error('Error adding course to cart:', error);
	  res.status(500).json({ error: 'Failed to add course to cart' });
	}
});


app.get('/cart', async (req, res) => {
	try {
	  // Retrieve all cart items from the database
	  const cartItems = await CartItem.find({});
   // Calculate the total price by summing up course prices
   const total = cartItems.reduce((acc, item) => acc + item.price, 0);
  
	  res.json(cartItems);
	} catch (error) {
	  console.error('Error retrieving cart items:', error);
	  res.status(500).json({ error: 'Failed to retrieve cart items' });
	}
  });

  app.delete('/cart/remove/:courseTitle', async (req, res) => {
	const { courseTitle } = req.params;
  
	try {
	  // Remove the cart item from the database
	  const result = await CartItem.deleteOne({ title: courseTitle });
  
	  if (result.deletedCount === 0) {
		return res.status(404).json({ error: 'Course not found in the cart' });
	  }
  
	  res.json({ message: 'Course removed from cart' });
	} catch (error) {
	  console.error('Error removing course from cart:', error);
	  res.status(500).json({ error: 'Failed to remove course from cart' });
	}
  });


//checkout

// Middleware function for user authentication
const authenticateUser = (req, res, next) => {
	const token = req.header("Authorization");

	if (!token) {
		return res.status(401).json({ error: "Unauthorized: No token provided" });
	}

	try {
		const decoded = jwt.verify(token, "secret123");

		// Attach the user data to the request object
		req.user = decoded.user;
		next();
	} catch (error) {
		return res.status(401).json({ error: "Unauthorized: Invalid token" });
	}
};

app.post("/checkout", authenticateUser, async (req, res) => {
	const { name, address, email, cart } = req.body;
	const userId = req.user.id;

	try {
		const order = new Order({
			name,
			address,
			email,
			cart,
		});

		await order.save();
		res.json({ message: "Order placed successfully" });
	} catch (error) {
		console.error("Error placing order:", error);
		res.status(500).json({ error: "Failed to place order" });
	}
});

//course upload

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads");
	},
	filename: (req, file, cb) => {
		const timestamp = Date.now();
		cb(null, `${timestamp}-${file.originalname}`);
	},
});

const upload = multer({ storage });



app.get("/allcourses", async (req, res) => {
	try {
		const courses = await Course.find(); // Retrieve all courses from the database
		res.json(courses); // Send the courses as an array in the response
	} catch (error) {
		console.error("Error fetching courses:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// Middleware function to check if the user is an admin
function isAdmin(req, res, next) {
	const token = req.header("Authorization");

	if (!token) {
		return res.status(401).json({ error: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, "secret123");
		if (decoded.user && decoded.user.admin) {
			req.user = decoded.user;
			next(); // User is an admin, proceed to the next middleware or route handler
		} else {
			return res
				.status(403)
				.json({ error: "Access denied. User is not an admin." });
		}
	} catch (ex) {
		return res.status(400).json({ error: "Invalid token." });
	}
}

app.post("/upload", isAdmin, upload.single("image"), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: "No file uploaded" });
	}
	const imagePath = req.file.path;
	console.log(req.body);

	const c = await Course.create({
		cname: req.body.cname,
		title: req.body.title,
		description: req.body.description,
		price: req.body.price,
		image: req.file.filename,
	});

	res.status(200).json({ message: "File uploaded successfully", imagePath });
});

app.get("/allcourses/:title", async (req, res) => {
	try {
		const course = await Course.findOne({ title: req.params.title });
		if (!course) {
			return res
				.status(404)
				.json({ success: false, message: "Course not found" });
		}

		res.status(200).json({ success: true, data: course });
	} catch (error) {
		console.error("Error fetching course by title:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

app.post("/allcourses/updatecourse/:title", async (req, res) => {
	const { title } = req.params; // Get the course title from the URL parameter

	// Find the course by title and update it
	const updatedCourse = await Course.findOneAndUpdate(
		{ title },
		{
			cname: req.body.cname,
			title: req.body.title,
			description: req.body.description,
			price: req.body.price,
		},
		{ new: true } // Return the updated course
	);

	if (!updatedCourse) {
		return res.status(404).json({ message: "Course not found" });
	}

	res
		.status(200)
		.json({ message: "Course updated successfully", updatedCourse });
	console.log("Course Updated");
});

app.listen(port, () => {
	console.log(`Backend app listening on port ${port}`);
});
