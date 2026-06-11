import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const CommonLayout = ({ children }) => {
  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default CommonLayout;
