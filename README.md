# ARF
Advanced Reconnaissance Framework

http://osintframework.com

## Notes
OSINT framework focused on gathering information from free tools or resources.  Everything included in the framework should be either entirely free, return some free information, or at the very least have a free trial available.

I originally created this framework with an information security point of view.  Since then, the response from other fields and disciplines has been awesome.  I would love to be able to include any other OSINT resources, especially from fields outside of infosec.  Please let me know about anything that might be missing!

### Instructions for installing/running locally

<ol start="1">
  <li>Clone this repo</li>
  <li>Open a terminal in repo directory</li>
</ol>

_and then..._

#### install dependencies with npm:
<ol start="3">
  <li>Run `npm install`</li>
  <li>Run `npm start` to start SimpleHTTPServer in the /public directory on port 8000 (you'll need python installed for this, of course)</li>
  <li>Open your browser to http://localhost:8000</li>
</ol>

##### install dependencies with bower:
<ol start="3">
  <li>Run `bower install`</li>
  <li>Run `cd ./public; python -m SimpleHTTPServer 8000` (you'll need python installed for this, of course)</li>
  <li>Open your browser to http://localhost:8000</li>
</ol>

### For Update Notifications
Follow me on Twitter: @jnordine - https://twitter.com/jnordine  
Watch or star the project on Github: https://github.com/lockfale/arf

### Suggestions, Comments, Feedback
Feedback or new tool suggestions are extremely welcome!  Please feel free to submit a pull request or open an issue on github or reach out on Twitter.

## To Do
- [ ] Expand / Collapse all buttons
- [ ] Single category expansion
- [ ] Fix "the boldening"
- [ ] Look into best way to display extra information for each site/tool
- [ ] Find a good way to crowdsource rating information
- [ ] Update d3js
