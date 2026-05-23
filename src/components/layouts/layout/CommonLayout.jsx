import React from "react";
import Header from "../Header";
import Login from "../../Auth/Login";

const CommonLayout = ({ children }) => {
  return (
    <>
      <Header />
      <Login />
      {children}
    </>
  );
};

export default CommonLayout;
