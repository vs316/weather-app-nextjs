import React, { useRef, useEffect, useState } from "react";
import { MdOutlineLocationOn, MdWbSunny } from "react-icons/md";
import { MdMyLocation } from "react-icons/md";
import SearchBox from "./SearchBox";
import axios from "axios";
import { loadingCityAtom, placeAtom } from "@/app/atom";
import { useAtom } from "jotai";

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_KEY;
type SuggestionBoxProps = {
  showSuggestions: boolean;
  suggestions: string[];
  handleSuggestionClick: (
    value: string,
    event: React.MouseEvent<HTMLLIElement>
  ) => void;
  error: string;
};

export default function Navbar({ location }: { location?: string }) {
  const [city, setCity] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [place, setPlace] = useAtom(placeAtom);
  const [_, setLoadingCity] = useAtom(loadingCityAtom);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleInputChange(value: string): Promise<void> {
    setCity(value);
    if (value.length >= 3) {
      const isZipCode = /^\d{5}$/.test(value); // Check if input is a zip code
      const queryParam = isZipCode ? `zip=${value}` : `q=${value}`; // Determine the query parameter based on input type

      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/find?${queryParam}&appid=${API_KEY}`
        );

        // If it's a zip code search, we won't have a list of suggestions
        if (isZipCode) {
          setPlace(response.data.name); // Set the place directly if it's a zip code
          setShowSuggestions(false);
        } else {
          const suggestions: string[] = response.data.list.map(
            (item: any) => item.name
          );
          setSuggestions(suggestions);
          setShowSuggestions(true);
        }
        setError("");
      } catch (error) {
        setError("Location not found");
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSuggestionClick(value: string): void {
    setCity(value);
    setShowSuggestions(false);
  }

  function handleSubmitSearch(e: React.FormEvent<HTMLFormElement>): void {
    setLoadingCity(true);
    e.preventDefault();
    if (suggestions.length === 0) {
      setError("Location not found");
      setLoadingCity(false);
    } else {
      setError("");
      setTimeout(() => {
        setLoadingCity(false);
        setPlace(city);
        setShowSuggestions(false);
      }, 500);
    }
  }

  function handleCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          try {
            setLoadingCity(true);
            const response = await axios.get(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
            );
            setTimeout(() => {
              setLoadingCity(false);
              setPlace(response.data.name);
            }, 500);
          } catch (error) {
            setLoadingCity(false);
          }
        }
      );
    }
  }

  return (
    <>
      <nav className="shadow-sm sticky top-0 left-0 z-50 bg-customColor/30 backdrop-blur-lg border border-transparent">
        <div className="h-[80px] w-full flex justify-between items-center max-w-7xl px-3 mx-auto">
          <p className="flex items-center justify-center gap-2">
            <h2 className="text-3xl gradient-text">WhatTheWeather!</h2>
            <MdWbSunny className="text-3xl mt-1 text-yellow-300" />
          </p>
          <section className="flex gap-2 items-center md:justify-end">
            <MdMyLocation
              title="Your Current Location"
              onClick={handleCurrentLocation}
              className="cursor:pointer text-2xl relative inline-flex h-fit w-fit rounded-full border border-blue-100/20 bg-blue-200/10 px-4 py-2 text-blue-200 outline-none ring-yellow-300 transition-colors after:absolute after:inset-0 after:-z-10 after:animate-pulse after:rounded-full after:bg-yellow-100 after:bg-opacity-0 after:blur-md after:transition-all after:duration-500 hover:border-yellow-200/40 hover:text-yellow-300 after:hover:bg-opacity-15 focus:ring-2
              "
            />
            <MdOutlineLocationOn className="text-3xl text-white hidden md:block" />
            <p className="gradient-text text-sm hidden md:block">
              {" "}
              {location}{" "}
            </p>
            <div className="relative hidden md:flex" ref={searchRef}>
              <SearchBox
                value={city}
                onSubmit={handleSubmitSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(e.target.value)
                }
              />
              <SuggestionBox
                showSuggestions={showSuggestions}
                suggestions={suggestions}
                handleSuggestionClick={handleSuggestionClick}
                error={error}
              />
            </div>
          </section>
        </div>
      </nav>
      <section className="flex max-w-7xl px-3 md:hidden">
        <div className="relative w-full">
          <SearchBox
            value={city}
            onSubmit={handleSubmitSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e.target.value)
            }
          />
          <SuggestionBox
            showSuggestions={showSuggestions}
            suggestions={suggestions}
            handleSuggestionClick={handleSuggestionClick}
            error={error}
          />
        </div>
      </section>
    </>
  );
}

function SuggestionBox({
  showSuggestions,
  suggestions,
  handleSuggestionClick,
  error,
}: SuggestionBoxProps) {
  return (
    <>
      {((showSuggestions && suggestions.length > 1) || error) && (
        <ul className="mb-4 absolute top-[44px] left-0 rounded-md min-w-[200px] flex flex-col gap-1 py-2 px-2 bg-white border border-transparent">
          {error && suggestions.length < 1 && (
            <li className="text-red-500 p-1 "> {error}</li>
          )}
          {suggestions.map((item: string, i: number) => (
            <li
              key={i}
              onClick={(e) => handleSuggestionClick(item, e)}
              className="cursor-pointer p-1 rounded hover:bg-gray-200"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
