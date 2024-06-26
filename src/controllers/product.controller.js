import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";

const addProduct = asyncHandler(async (req, res) => {
  const { name, keywords, description, price, negotiable } = req.body;

  const validatename = name.length;
  const validatedescription = description.length;

  if (validatename < 3) {
    res.status(400);
    throw new Error("Name must be of 3 characters  or more length ");
  }
  if (validatedescription < 20) {
    res.status(400);
    throw new Error("Description must be of 20 characters  or more length ");
  }

  const files = req.files;

  if (files.length === 0) {
    throw new ApiError(400, "Images are required to register a product");
  }

  const cloudinaryUploadPromises = files.map(async (file) => {
    const productFilePath = file.path;
    const productImage = await uploadOnCloudinary(productFilePath);
    return productImage.url;
  });

  const uploadedImages = await Promise.all(cloudinaryUploadPromises);

  if (!uploadedImages) {
    throw new ApiError(400, "product image is required");
  }

  const product = await Product.create({
    description,
    images: uploadedImages,
    keywords,
    name,
    cost: { price, negotiable },
    owner: req.user._id,
  });

  const createdProduct = await Product.findById(product._id).select(
    "-description"
  );

  if (!createdProduct) {
    throw new ApiError(400, "something went wrong while adding product");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdProduct, "product Added Successfully"));
});

const getUserProduct = asyncHandler(async (req, res) => {
  try {
    const userProducts = await Product.find({ owner: req.user._id }).populate(
      "owner",
      "username"
    );

    if (userProducts === "") {
      throw new ApiError(400, `No product is listed by ${req.user.fullname} `);
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { userProducts },
          `Products listed by ${req.user.fullname} fetched successfully`
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Internal Server Error while fetching user product"
    );
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({
      isPublished: true,
    }).populate("owner", "fullname");

    if (products === "") {
      throw new ApiError(400, "No product exits");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, { products }, "product fetched successfully"));
  } catch (error) {
    console.error(error);
    return ApiError(400, "Error while fetching products");
  }
});

const getUnsoldProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({
      isPublished: true,
      sold: false,
    }).populate("owner", "username");

    if (products === "") {
      throw new ApiError(400, "No product exits");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, { products }, "product fetched successfully"));
  } catch (error) {
    console.error(error);
    return ApiError(400, "Error while fetching products");
  }
});

const editProduct = asyncHandler(async (req, res) => {
  try {
    const { name, description, keywords, price, sold, negotiable, images } =
      req.body;

    const product = await Product.findById(req.params.id);

    const validatename = name.length;
    const validatedescription = description.length;

    if (product.name !== name && validatename < 3) {
      throw new ApiError(400, "Name must be of 3 characters  or more length ");
    }
    if (product.description !== description && validatedescription < 7) {
      throw new ApiError(
        400,
        "Description must be of 7 characters  or more length "
      );
    }

    await Product.findByIdAndUpdate(product._id, {
      name: name,
      description: description,
      cost: { price, negotiable },
      keywords,
      images,
      sold,
    });

    const newProduct = await Product.findById(product._id);

    return res
      .status(201)
      .json(
        new ApiResponse(200, { newProduct }, "Product Edited Successfully")
      );
  } catch (error) {
    console.log("error in editProduct", error);
    throw new ApiError(500, "Internal server error in edit product");
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id || req.body);

    if (!product) {
      throw new Error("Product not found");
    }

    const imageUrls = product.images;

    await Promise.all(
      imageUrls.map(async (imageUrl) => {
        deleteOnCloudinary(imageUrl);
      })
    );

    await Product.findByIdAndDelete(req.params.id);

    return res
      .status(201)
      .json(new ApiResponse(200, {}, "Product Deleted Successfully"));
  } catch (error) {
    console.error("Error deleting product:", error.message);
  }
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "owner",
    "username"
  );

  if (!product) {
    throw new ApiError(500, "No Product Found");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, product, "product found Succesfully"));
});

const deleteUserProduct = asyncHandler(async (req, res) => {
  try {
    const userId = req.body;
    if (!userId) {
      throw new ApiError(500, "Server Error in deleting user's product");
    }
    const userProducts = await Product.find({ owner: userId });

    await Promise.all(
      userProducts.map(async (product) => {
        await deleteProduct(product._id);
      })
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, {}, "products listed by User deleted successfully")
      );
  } catch (error) {
    res
      .status(500)
      .json(
        new ApiResponse(500, {}, "Internal server error in deleteUserProduct")
      );
  }
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const image = req.body;
  const productId = req.params.id;

  deleteOnCloudinary(image);

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $pull: { images: image } },
    { new: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, { updatedProduct }, "Image Deleted successfully")
    );
});

const AddProductImage = asyncHandler(async (req, res) => {
  const files = req.files;
  const productId = req.params.id;

  if (files.length === 0) {
    throw new ApiError(400, "Images are required to add to a product");
  }

  try {
    const cloudinaryUploadPromises = files.map(async (file) => {
      const productFilePath = file.path;
      const productImage = await uploadOnCloudinary(productFilePath);
      return productImage.url;
    });

    const uploadedImages = await Promise.all(cloudinaryUploadPromises);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $push: { images: { $each: uploadedImages } } },
      { new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, updatedProduct, "Image added succesfully"));
  } catch (error) {
    console.error("Error adding product image:", error);
    res
      .status(500)
      .json(
        new ApiResponse(500, {}, "Internal Server Error on AddProductImage")
      );
  }
});

export {
  addProduct,
  getAllProducts,
  getUserProduct,
  editProduct,
  deleteProduct,
  getProductById,
  deleteUserProduct,
  deleteProductImage,
  AddProductImage,
  getUnsoldProducts,
};
