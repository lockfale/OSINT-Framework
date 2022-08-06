# OSINT Framework v.2

http://osintframework.com

## Notes
OSINT framework v.2 focused on gathering information from free tools or resources. The intention is to help people find free OSINT resources. Some sites included might require registration or offer more data for $$$, but you should be able to get at least a portion of the available information for no cost.

I originally created this framework with an information security point of view. Since then, the response from other fields and disciplines has been incredible. I would love to be able to include any other OSINT resources, especially from fields outside of infosec. Please let me know about anything that might be missing!

Compared to version 1, the framework has been significantly changed structurally and supplemented, in particular, the resource base from Bellingcat (https://ru.bellingcat.com/) has been completely introduced into it, a large number of different utilities and links have been added, all inaccessible and non-working resources have been removed, resource descriptions have been added, the legend has been changed, coloring of branches has been added, search and more.

Please visit the framework at the link below and good hunting!

https://osintframework.com

### Legend
(T) - Indicates a link to a tool that must be installed and run locally  
(A) - Contains archives  
(D) - Google Dork, for more information: <a href="https://en.wikipedia.org/wiki/Google_hacking">Google Hacking</a>  
(API) - Contains API  
(R) - Requires registration  
(C) - For commercial use / paid service  
(I) - By Invitation  
(M) - Indicates a URL that contains the search term and the URL itself must be edited manually  
(U) - Currently unsupported, unmaintained or deprecated

### For Update Notifications
Follow me on Twitter: @jnordine - https://twitter.com/jnordine  
Watch or star the project on Github: https://github.com/lockfale/osint-framework

### Related links and thanks
Bellingcat Intelligence: https://bellingcat.com

### Suggestions, Comments, Feedback
Feedback or new tool suggestions are extremely welcome!  Please feel free to submit a pull request or open an issue on GitHub or reach out on Twitter.

### Contribute with a GitHub Pull Request
For new resources, please ensure that the site is available for public and free use.
<ol start="1">
  <li>Update the arf.json file in the format shown below. If this isn't the first entry for a folder, add a comma to the last closing brace of the previous entry.</li>
</ol>

```
{
  "name": "Example Name",
  "type": "url",
  "url": "http://example.com",
  "description": "Service description",
  "color": "red"
}
```

* 'type' field can take 'folder' or 'url' values. 'description' and 'color' fields are not required.

<ol start="2">
  <li>Submit pull request!</li>
</ol>

Thank you!

## OSINT Framework Website

https://osintframework.com

Happy Hunting!