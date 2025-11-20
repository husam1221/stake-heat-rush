import React from "react";

const Toast = ({ type, message }) => {
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>{message}</div>
    </div>
  );
};

export default Toast;
