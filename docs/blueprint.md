# **App Name**: Vision Insight

## Core Features:

- Image & Prompt Input Interface: A user interface featuring a drag-and-drop file upload zone for images and a text input field for analysis instructions (default placeholder: 'Identify and label any defects in this image').
- Input Validation & Submission Control: Validate that both an image and a text prompt are present; disable the 'Analyze Image' button if inputs are missing.
- AI Safety Pre-Check: Upon submission, perform a Gemini API call as a tool to review the text prompt and image for safety and validity before main processing.
- Backend API Communication: If the safety pre-check passes, send the image file and prompt via a POST request to the local backend API at 'http://localhost:8000/robot-helper'.
- Dynamic Result Display: Render the HTML string returned by the backend safely into a dedicated, styled results area without overwriting other UI elements.
- Loading State & User Feedback: Display relevant loading indicators ('Validating inputs...', 'Processing...') and disable controls during API calls.
- Robust Error Handling: Catch errors from both the Gemini pre-check and the main API call, displaying clear, styled alert messages to the user.

## Style Guidelines:

- Primary color: Muted steel blue (#5A7B9B) chosen for a professional, precise, and calming feel. Its deep tone ensures contrast with a light background.
- Background color: Very light, desaturated slate (#F5F8F9) to provide a clean and expansive canvas, complementing the primary color's hue.
- Accent color: Bright aquamarine (#0CCDC2) with high saturation and brightness, used for highlights and interactive elements, providing a refreshing contrast to the primary.
- Headline and body text font: 'Inter', a grotesque-style sans-serif for its modern, objective, and neutral appearance, perfect for a clean interface.
- Utilize modern, clean line-art icons that maintain visual simplicity and professionalism, enhancing the overall clean aesthetic.
- The layout features a centered 'card' design, providing clear content hierarchy with distinct areas for input, action, and results, enhancing usability.
- Incorporate subtle animations for loading states and component transitions, providing smooth user feedback without being distracting.