"use client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { ReactElement, useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [inputValue, setInputValue] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [imgData, setImgData] = useState<Blob>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imgUrl, setImgUrl] = useState<string>();

  useEffect(() => {
    if (inputUrl) {
      setIsLoading(true);
      fetch(`/api/image?url=${inputUrl}`)
        .then((res) => res.blob())
        .then((blob) => {
          setImgData(blob);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setIsLoading(false);
        });
    }
  }, [inputUrl]);

  useEffect(() => {
    if (imgData instanceof Blob) {
      const blobUrl = URL.createObjectURL(imgData);
      setImgUrl(blobUrl);
      return () => {
        URL.revokeObjectURL(blobUrl);
        setImgData(undefined); // set imgData to undefined to release the reference to the Blob object
      };
    }
  }, [imgData]);

  const handleDownloadClick = () => {
    setInputUrl(encodeURIComponent(inputValue));
  };

  const imgDOM: ReactElement = isLoading ? (
    <svg
      viewBox="0 0 38 38"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#fff"
      className="pt-6 w-20 h-20"
    >
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth={2}>
          <circle strokeOpacity=".5" cx={18} cy={18} r={18} />
          <path d="M36 18c0-9.94-8.06-18-18-18">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 18 18"
              to="360 18 18"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </g>
    </svg>
  ) : imgUrl ? (
    <img src={imgUrl} alt="Full size image (Save as...)" />
  ) : (
    <img
      src="https://images.unsplash.com/flagged/photo-1572392640988-ba48d1a74457?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8YXJ0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60"
      alt="Placeholder"
    />
  );

  return (
    <>
      <div className={inter.className}>
        <div className="pt-10">
          <h1 className="text-center text-2xl font-bold ">
            <a href="https://catalog.shm.ru/" className="text-amber-200">
              State Historical Museum
            </a>{" "}
            and{" "}
            <a
              href="https://pushkinmuseum.art/exposition_collection/index.php?lang=en"
              className="text-amber-200"
            >
              The Pushkin Museum
            </a>{" "}
            Downloader
          </h1>
        </div>

        <div className="flex flex-wrap  items-center  overflow-x-auto overflow-y-hidden py-10 justify-center">
          <label htmlFor="search" className="mb-2 text-sm font-medium sr-only ">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="search"
              className="block xl:w-[900px] md:w-[700px] sm:w-[400px] p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Page URL"
              onChange={(event) => setInputValue(event.target.value)}
              required
            />
            <button
              type="submit"
              className="text-white  absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:bg-gray-500"
              onClick={handleDownloadClick}
              disabled={isLoading}
            >
              Download Image
            </button>
          </div>
        </div>

        <section className="flex justify-center bg-slate-600 h-[700px]">
          {imgDOM}
        </section>
      </div>
    </>
  );
}
