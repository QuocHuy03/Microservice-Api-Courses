const jwt = require("jsonwebtoken");

export const generateToken = async (
  data: any,
  secretSignature: any,
  tokenLife: any
) => {
  try {
    return await jwt.sign(data, secretSignature, {
      expiresIn: tokenLife,
    });
  } catch (error) {
    console.log(`Error in generate access token: ${error}`);
    throw error;
  }
};

export const verifyToken = async (token: any, secretKey: any) => {
  try {
    return await jwt.verify(token, secretKey);
  } catch (error: any) {
    console.log(`Error in verify access token: ${error}`);
    throw error;
  }
};

export const decodeToken = async (token: any, secretKey: any) => {
  try {
    return await jwt.verify(token, secretKey);
  } catch (error: any) {
    console.log(`Error in decode access token: ${error}`);
    throw error;
  }
};
