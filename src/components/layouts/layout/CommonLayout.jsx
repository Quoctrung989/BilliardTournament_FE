import React from "react";
import Header from "../Header";

const CommonLayout = ({ children }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default CommonLayout;
