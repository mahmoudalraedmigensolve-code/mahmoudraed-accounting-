// Exchange Rate API Service

const API_KEY = "f483089bd74e116b8ff2f196";
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/EGP`;

/**
 * Fetches the latest exchange rates from exchangerate-api.com
 * Base currency is EGP (Egyptian Pound)
 * Free tier: 1,500 requests per month
 */
export async function fetchExchangeRates(): Promise<{
  EGP: number;
  USD: number;
  GBP: number;
}> {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();

    if (data.result !== "success" || !data.conversion_rates) {
      throw new Error("Invalid response from exchange rate API");
    }

    // Rates from API are EGP to other currencies
    // We need to reverse them to get USD/GBP to EGP
    const egpToUsd = data.conversion_rates.USD; // e.g., 1 EGP = 0.02 USD
    const egpToGbp = data.conversion_rates.GBP; // e.g., 1 EGP = 0.016 GBP

    // Reverse the rates
    const usdToEgp = 1 / egpToUsd; // e.g., 1 USD = 50 EGP
    const gbpToEgp = 1 / egpToGbp; // e.g., 1 GBP = 62.5 EGP

    return {
      EGP: 1,
      USD: usdToEgp,
      GBP: gbpToEgp,
    };
  } catch (error) {
    console.error("Error fetching exchange rates:", error);

    // Fallback to default rates if API fails
    return {
      EGP: 1,
      USD: 50,
      GBP: 65,
    };
  }
}
