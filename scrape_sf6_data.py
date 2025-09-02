import time
import re
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

# ⚠️ IMPORTANT: Replace with environment variables in production
CREDENTIALS = {
    "email": "gonzalovarelasteam@gmail.com",
    "password": "capcomGonz4lo1",
}

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
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service)

        # ⭐ NEW: Spoof the navigator.webdriver property
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")

        print("Navigating directly to the CAPCOM ID login page...")
        driver.get("https://cid.capcom.com/en/login/")
        
        try:
            WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            ).click()
            print("Cookie consent banner dismissed.")
        except Exception:
            print("No cookie consent banner found or an error occurred. Continuing...")

        print("Attempting login...")
        
        # ⭐ NEW: Add a short delay to appear more human
        time.sleep(2)
        
        email_input = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "email"))
        )
        email_input.send_keys(CREDENTIALS["email"])
        
        # ⭐ NEW: Add a short delay between typing email and password
        time.sleep(1)

        password_input = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "password"))
        )
        password_input.send_keys(CREDENTIALS["password"])
        
        login_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
        login_button.click()
        
        print("Waiting for page to redirect after login...")
        WebDriverWait(driver, 10).until(
            EC.url_contains("https://www.streetfighter.com/6/buckler/")
        )
        
        print("Navigating to rankings page...")
        driver.get("https://www.streetfighter.com/6/buckler/ranking/master")
        
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "rank-list"))
        )
        
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