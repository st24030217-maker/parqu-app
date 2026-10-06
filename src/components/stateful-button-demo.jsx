"use client";

import React from "react";
import { Button } from "./ui/stateful-button";

export default function StatefulButtonDemo() {
  const handleClick = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 4000);
    });
  };
  return (
    <div className="flex h-40 w-full items-center justify-center">
      <Button onClick={handleClick}>Iniciar Sesión y Entrar</Button>
    </div>
  );
}
