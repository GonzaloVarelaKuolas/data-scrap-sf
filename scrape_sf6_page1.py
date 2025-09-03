import time
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager
from bs4 import BeautifulSoup

# Character names to look for
CHARACTER_NAMES = [
    "Luke", "Jamie", "Manon", "Kimberly", "Marisa", "Lily", "JP", "Juri", 
    "Dee Jay", "Cammy", "Ryu", "E. Honda", "Blanka", "Guile", "Ken", "Chun-Li", 
    "Zangief", "Dhalsim", "Rashid", "A.K.I", "Ed", "Akuma", "Terry", "Mai", "Elena", "Bison"
]

def scrape_sf6_data():
    """
    Scrapes Street Fighter 6 character usage data from the official website.
    """
    print("Starting Street Fighter 6 character usage scraping with Selenium...")
    
    try:
        service = Service(GeckoDriverManager().install())
        driver = webdriver.Firefox(service=service)
        
        print("Navigating directly to the CAPCOM ID login page...")
        driver.get("https://cid.capcom.com/en/login/")
        
        try:
            WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            ).click()
            print("Cookie consent banner dismissed.")
        except Exception:
            print("No cookie consent banner found or an error occurred. Continuing...")

        print("Please log in manually in the browser window.")
        print("Waiting for page to redirect after login...")
        
        WebDriverWait(driver, 60).until(
            EC.url_contains("https://cid.capcom.com/en/mypage/")
        )
        print("CAPCOM ID login successful. Navigating to ranking page...")
        
        driver.get("https://www.streetfighter.com/6/buckler/ranking/master")

        # Wait for a manual trigger from the user
        print("\n--------------------------------------------------------------")
        print("Please ensure the ranking list is visible in the browser window.")
        print("If a 'Log In' button is present, please click it first.")
        input("When the page is ready to be scraped, press 'Y' and then Enter.")
        print("--------------------------------------------------------------\n")
        
        # ⭐ NEW: Use a more robust wait to ensure the page is ready before scraping
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(5) # Add a brief delay to allow dynamic content to load
        
        html_content = driver.page_source
        
        print("Successfully fetched rankings HTML. Parsing data...")

        soup = BeautifulSoup(html_content, 'html.parser')
        
        character_counts = {}
        for character in CHARACTER_NAMES:
            count = len(soup.find_all('img', alt=lambda x: x and character in x))
            character_counts[character] = count

        total_players = sum(character_counts.values())
        print(f"Scraped data for {total_players} players:")
        
        for character, count in sorted(character_counts.items(), key=lambda item: item[1], reverse=True):
            if total_players > 0:
                percentage = (count / total_players) * 100
                print(f"{character:<10}: {count:>3} players ({percentage:.2f}%)")
            else:
                print(f"{character:<10}: {count:>3} players (0.00%)")
        
    except Exception as e:
        print(f"An error occurred during scraping: {e}")
    finally:
        if 'driver' in locals() and driver:
            driver.quit()

if __name__ == "__main__":
    scrape_sf6_data()