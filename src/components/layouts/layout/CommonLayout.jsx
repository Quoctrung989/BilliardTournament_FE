import React from "react";
import Header from "../Header";
import Login from "../../Auth/Login";
import Register from '../../Auth/Register';
import ForgotPassword from "../../Auth/ForgotPassword";

const CommonLayout = ({ children }) => {
  return (
    <>
      <Header />
      <Login />
      <Register />
      <ForgotPassword />
      {children}
    </>
  );
};

export default CommonLayout;
