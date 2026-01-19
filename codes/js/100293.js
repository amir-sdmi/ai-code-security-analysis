import { useEffect, useState } from "react";

const mainUrl = `https://v6.exchangerate-api.com/v6/${
  import.meta.env.VITE_EXCHANGE_RATE_API_KEY
}/latest`;

const useCurrencyConverter = () => {
  const defaultCurrencyType = "USD";
  const [rates, setRates] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConvertedCurrency = async () => {
      try {
        const response = await fetch(`${mainUrl}/${defaultCurrencyType}`);
        const data = await response.json();

        // setRates in an if statement suggested by chatGpt for safety
        if (data.result === "success") {
          setRates(data.conversion_rates);
        }
        console.log(response);
      } catch (error) {
        setError(error.message);
        console.log(error.message);
      }
    };

    fetchConvertedCurrency();
  }, []);

  return { rates };
};

export default useCurrencyConverter;
