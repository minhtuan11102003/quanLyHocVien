"use client";
import { useState, useEffect } from "react";

type Student = {
  id: string;
  maSoHV: number;
  name: string;
  majorId: number;
  classId: number;
  donVi: string;
  chucVu: string;
  // id: "gaueDaQczVk";
  // maSoHV: 101100143;
  // name: "Nguyễn Xuân Minh Tuân";
  // majorId: 1;
  // classId: 2;
  // donVi: "Đại đội 4";
  // chucVu: "Học viên";
};

type major = {
  majorId: number;
  name: string;
  shortName: string;
  //     "id": 1,
  //     "name": "Nhân viên quân y đại đội",
  //     "shortName": "NVQYcK43"
};

type classes = {
  id: number;
  majorId: number;
  name: string;
  // "id": 1,
  // "majorId": 1,
  // "name": "A3"
};

export default function ProductPage() {
  return <div>đây là product</div>;
}
