from playwright.sync_api import sync_playwright

def verify_sidebar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/dashboard")
        page.wait_for_timeout(3000) # Wait for potential redirect

        # If redirected to login, try to login or bypass
        if "/login" in page.url:
            print("Redirected to login, trying to bypass...")
            # Often apps have a simple bypass for testing, or we just rely on unit tests for component

        # Take a screenshot
        page.screenshot(path="sidebar_verification2.png")
        browser.close()

if __name__ == "__main__":
    verify_sidebar()
