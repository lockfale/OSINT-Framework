# OSINT Framework

The OSINT Framework is a dynamic, web-based interface for a vast collection of Open Source Intelligence (OSINT) tools and resources. Originally created for the information security community, it has since grown to become an essential resource for a wide array of fields. This framework presents OSINT resources in an interactive, mind-map-style graph, making it easy to navigate and discover tools for your specific needs.

This fork features a completely redesigned user interface with a modern, professional aesthetic, including glassmorphism effects, a responsive layout, and a user-friendly dark mode.

## Features

-   **Interactive & Responsive Graph:** A fully responsive D3.js-powered tree graph that visualizes the entire OSINT landscape.
-   **Modern UI:** A beautiful and intuitive interface built with a glassmorphism design, featuring a light and dark mode.
-   **Powerful Search:** Instantly find any tool or resource with a powerful search that features autocompletion.
-   **Dynamic Highlighting:** The search function expands the tree to reveal matches and highlights all relevant nodes and their parent branches for easy identification.
-   **Categorized & Easy to Navigate:** Resources are logically grouped, and the graph interface makes discovering new tools intuitive and efficient.
-   **Client-Side:** The entire application runs directly in your browser. No server-side processing is required.

## Tech Stack

-   **HTML5 & CSS3:** For the core structure and modern styling.
-   **JavaScript (ES6+):** For all client-side logic and interactivity.
-   **D3.js (v3):** For rendering the powerful and interactive data visualization.
-   **Font Awesome:** For modern, scalable icons.
-   **live-server:** A simple development server with live reload functionality.

## Getting Started

### Prerequisites

You need to have [Node.js](https://nodejs.org/) and npm (which comes with Node.js) installed on your system.

### Installation & Launch

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/lockfale/osint-framework.git
    cd osint-framework
    ```

2.  **Install `live-server` (if you don't have it):**
    ```bash
    npm install -g live-server
    ```

3.  **Launch the application:**
    Navigate to the project's root directory and run the following command to start the server:
    ```bash
    live-server --port=8080 public/
    ```

4.  Open your web browser and navigate to `http://127.0.0.1:8080`.

## Usage

- **Click on nodes** to expand or collapse categories.
- **Click on links** to open the corresponding resource in a new tab.
- **Use the search bar** to filter the graph.
- **Toggle the dark mode switch** for a different theme.

### Legend

- **(T)**: Indicates a tool that must be installed and run locally.
- **(D)**: Google Dork.
- **(R)**: Requires registration.
- **(M)**: Indicates a URL that contains the search term and the URL itself must be edited manually.

## Project Structure

```
OSINT-Framework/
├── public/
│   ├── css/
│   │   └── arf.css         # Main stylesheet with glassmorphism UI
│   ├── js/
│   │   ├── arf.js          # Core JavaScript for D3 graph and search
│   │   └── d3.v3.min.js    # D3.js library
│   ├── arf.json            # The dataset for the OSINT graph
│   └── index.html          # Main HTML file
├── package.json
├── package-lock.json
└── README.md
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

### Adding a New OSINT Resource

1.  **Fork the Project.**
2.  **Update the Data:** Open `public/arf.json` and add your new resource. Please ensure the resource is publicly accessible and free to use. Follow the existing format:
    ```json
    {
      "name": "Example Name",
      "type": "url",
      "url": "http://example.com",
      "description": "A brief description of the resource."
    }
    ```
    *If you are adding to an existing category, remember to add a comma after the preceding entry.*
3.  **Create a Pull Request:** Submit your changes for review.

### Suggestions and Feedback
Feedback or new tool suggestions are extremely welcome! Please feel free to submit a pull request or open an issue on GitHub. For update notifications, you can watch or star the project on Github.

## About The Framework

> OSINT framework focused on gathering information from free tools or resources. The intention is to help people find free OSINT resources. Some of the sites included might require registration or offer more data for $$$, but you should be able to get at least a portion of the available information for no cost.
>
> I originally created this framework with an information security point of view. Since then, the response from other fields and disciplines has been incredible. I would love to be able to include any other OSINT resources, especially from fields outside of infosec. Please let me know about anything that might be missing!
>
> -- *Justin Nordine*

The official framework can be found at [osintframework.com](https://osintframework.com).

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgements

-   A big thank you to **Justin Nordine** ([@jnordine](https://twitter.com/jnordine)) for creating and maintaining the original OSINT Framework and its invaluable dataset.
-   All the contributors who have helped expand the framework over the years.
