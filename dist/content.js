/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 609:
/***/ (function(module) {

!function(t,e){ true?module.exports=e():0}("undefined"!=typeof self?self:this,(()=>(()=>{"use strict";var t={0:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.mathRules=e.createCleanMathEl=void 0;const n=r(282);e.createCleanMathEl=(t,e,r,n)=>{const o=t.createElement("math");if(o.setAttribute("xmlns","http://www.w3.org/1998/Math/MathML"),o.setAttribute("display",n?"block":"inline"),o.setAttribute("data-latex",r||""),null==e?void 0:e.mathml){const r=t.createElement("div");r.innerHTML=e.mathml;const n=r.querySelector("math");n&&(o.innerHTML=n.innerHTML)}else r&&(o.textContent=r);return o},e.mathRules=[{selector:n.mathSelectors,element:"math",transform:(t,r)=>{if(!function(t){return"classList"in t&&"getAttribute"in t&&"querySelector"in t}(t))return t;const o=(0,n.getMathMLFromElement)(t),i=(0,n.getBasicLatexFromElement)(t),a=(0,n.isBlockDisplay)(t),s=(0,e.createCleanMathEl)(r,o,i,a);if(t.parentElement){t.parentElement.querySelectorAll('\n\t\t\t\t\t/* MathJax scripts and previews */\n\t\t\t\t\tscript[type^="math/"],\n\t\t\t\t\t.MathJax_Preview,\n\n\t\t\t\t\t/* External math library scripts */\n\t\t\t\t\tscript[type="text/javascript"][src*="mathjax"],\n\t\t\t\t\tscript[type="text/javascript"][src*="katex"]\n\t\t\t\t').forEach((t=>t.remove()))}return s}}]},20:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.GrokExtractor=void 0;const n=r(181);class o extends n.ConversationExtractor{constructor(t,e){super(t,e),this.messageContainerSelector=".relative.group.flex.flex-col.justify-center.w-full",this.messageBubbles=t.querySelectorAll(this.messageContainerSelector),this.footnotes=[],this.footnoteCounter=0}canExtract(){return!!this.messageBubbles&&this.messageBubbles.length>0}extractMessages(){const t=[];return this.footnotes=[],this.footnoteCounter=0,this.messageBubbles&&0!==this.messageBubbles.length?(this.messageBubbles.forEach((e=>{var r;const n=e.classList.contains("items-end"),o=e.classList.contains("items-start");if(!n&&!o)return;const i=e.querySelector(".message-bubble");if(!i)return;let a="",s="",l="";if(n)a=i.textContent||"",s="user",l="You";else if(o){s="assistant",l="Grok";const t=i.cloneNode(!0);null===(r=t.querySelector(".relative.border.border-border-l1.bg-surface-base"))||void 0===r||r.remove(),a=t.innerHTML,a=this.processFootnotes(a)}a.trim()&&t.push({author:l,content:a.trim(),metadata:{role:s}})})),t):t}getFootnotes(){return this.footnotes}getMetadata(){var t;const e=this.getTitle(),r=(null===(t=this.messageBubbles)||void 0===t?void 0:t.length)||0;return{title:e,site:"Grok",url:this.url,messageCount:r,description:`Grok conversation with ${r} messages`}}getTitle(){var t,e;const r=null===(t=this.document.title)||void 0===t?void 0:t.trim();if(r&&"Grok"!==r&&!r.startsWith("Grok by "))return r.replace(/\s-\s*Grok$/,"").trim();const n=this.document.querySelector(`${this.messageContainerSelector}.items-end`);if(n){const t=n.querySelector(".message-bubble");if(t){const r=(null===(e=t.textContent)||void 0===e?void 0:e.trim())||"";return r.length>50?r.slice(0,50)+"...":r}}return"Grok Conversation"}processFootnotes(t){return t.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi,((t,e,r)=>{if(!e||e.startsWith("#")||!e.match(/^https?:\/\//i))return t;let n;if(this.footnotes.find((t=>t.url===e)))n=this.footnotes.findIndex((t=>t.url===e))+1;else{this.footnoteCounter++,n=this.footnoteCounter;let t=e;try{const r=new URL(e).hostname.replace(/^www\./,"");t=`<a href="${e}" target="_blank" rel="noopener noreferrer">${r}</a>`}catch(r){t=`<a href="${e}" target="_blank" rel="noopener noreferrer">${e}</a>`,console.warn(`GrokExtractor: Could not parse URL for footnote: ${e}`)}this.footnotes.push({url:e,text:t})}return`${r}<sup id="fnref:${n}" class="footnote-ref"><a href="#fn:${n}" class="footnote-link">${n}</a></sup>`}))}}e.GrokExtractor=o},181:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.ConversationExtractor=void 0;const n=r(279),o=r(628);class i extends n.BaseExtractor{getFootnotes(){return[]}extract(){var t;const e=this.extractMessages(),r=this.getMetadata(),n=this.getFootnotes(),i=this.createContentHtml(e,n),a=document.implementation.createHTMLDocument(),s=a.createElement("article");s.innerHTML=i,a.body.appendChild(s);const l=new o.Defuddle(a).parse(),c=l.content;return{content:c,contentHtml:c,extractedContent:{messageCount:e.length.toString()},variables:{title:r.title||"Conversation",site:r.site,description:r.description||`${r.site} conversation with ${e.length} messages`,wordCount:(null===(t=l.wordCount)||void 0===t?void 0:t.toString())||""}}}createContentHtml(t,e){return`${t.map(((e,r)=>{const n=e.timestamp?`<div class="message-timestamp">${e.timestamp}</div>`:"",o=/<p[^>]*>[\s\S]*?<\/p>/i.test(e.content)?e.content:`<p>${e.content}</p>`,i=e.metadata?Object.entries(e.metadata).map((([t,e])=>`data-${t}="${e}"`)).join(" "):"";return`\n\t\t\t<div class="message message-${e.author.toLowerCase()}" ${i}>\n\t\t\t\t<div class="message-header">\n\t\t\t\t\t<p class="message-author"><strong>${e.author}</strong></p>\n\t\t\t\t\t${n}\n\t\t\t\t</div>\n\t\t\t\t<div class="message-content">\n\t\t\t\t\t${o}\n\t\t\t\t</div>\n\t\t\t</div>${r<t.length-1?"\n<hr>":""}`})).join("\n").trim()}\n${e.length>0?`\n\t\t\t<div id="footnotes">\n\t\t\t\t<ol>\n\t\t\t\t\t${e.map(((t,e)=>`\n\t\t\t\t\t\t<li class="footnote" id="fn:${e+1}">\n\t\t\t\t\t\t\t<p>\n\t\t\t\t\t\t\t\t<a href="${t.url}" target="_blank">${t.text}</a>&nbsp;<a href="#fnref:${e+1}" class="footnote-backref">\u21a9</a>\n\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t</li>\n\t\t\t\t\t`)).join("")}\n\t\t\t\t</ol>\n\t\t\t</div>`:""}`.trim()}}e.ConversationExtractor=i},248:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.TwitterExtractor=void 0;const n=r(279);class o extends n.BaseExtractor{constructor(t,e){var r;super(t,e),this.mainTweet=null,this.threadTweets=[];const n=t.querySelector('[aria-label="Timeline: Conversation"]');if(!n){const e=t.querySelector('article[data-testid="tweet"]');return void(e&&(this.mainTweet=e))}const o=Array.from(n.querySelectorAll('article[data-testid="tweet"]')),i=null===(r=n.querySelector("section, h2"))||void 0===r?void 0:r.parentElement;i&&o.forEach(((t,e)=>{if(i.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING)return o.splice(e),!1})),this.mainTweet=o[0]||null,this.threadTweets=o.slice(1)}canExtract(){return!!this.mainTweet}extract(){const t=this.extractTweet(this.mainTweet),e=this.threadTweets.map((t=>this.extractTweet(t))).join("\n<hr>\n"),r=`\n\t\t\t<div class="tweet-thread">\n\t\t\t\t<div class="main-tweet">\n\t\t\t\t\t${t}\n\t\t\t\t</div>\n\t\t\t\t${e?`\n\t\t\t\t\t<hr>\n\t\t\t\t\t<div class="thread-tweets">\n\t\t\t\t\t\t${e}\n\t\t\t\t\t</div>\n\t\t\t\t`:""}\n\t\t\t</div>\n\t\t`.trim(),n=this.getTweetId(),o=this.getTweetAuthor();return{content:r,contentHtml:r,extractedContent:{tweetId:n,tweetAuthor:o},variables:{title:`Thread by ${o}`,author:o,site:"X (Twitter)",description:this.createDescription(this.mainTweet)}}}formatTweetText(t){if(!t)return"";const e=document.createElement("div");e.innerHTML=t,e.querySelectorAll("a").forEach((t=>{var e;const r=(null===(e=t.textContent)||void 0===e?void 0:e.trim())||"";t.replaceWith(r)})),e.querySelectorAll("span, div").forEach((t=>{t.replaceWith(...Array.from(t.childNodes))}));return e.innerHTML.split("\n").map((t=>t.trim())).filter((t=>t)).map((t=>`<p>${t}</p>`)).join("\n")}extractTweet(t){var e,r,n;if(!t)return"";const o=t.cloneNode(!0);o.querySelectorAll('img[src*="/emoji/"]').forEach((t=>{if("img"===t.tagName.toLowerCase()&&t.getAttribute("alt")){const e=t.getAttribute("alt");e&&t.replaceWith(e)}}));const i=(null===(e=o.querySelector('[data-testid="tweetText"]'))||void 0===e?void 0:e.innerHTML)||"",a=this.formatTweetText(i),s=this.extractImages(t),l=this.extractUserInfo(t),c=null===(n=null===(r=t.querySelector('[aria-labelledby*="id__"]'))||void 0===r?void 0:r.querySelector('[data-testid="User-Name"]'))||void 0===n?void 0:n.closest('[aria-labelledby*="id__"]'),u=c?this.extractTweet(c):"";return`\n\t\t\t<div class="tweet">\n\t\t\t\t<div class="tweet-header">\n\t\t\t\t\t<span class="tweet-author"><strong>${l.fullName}</strong> <span class="tweet-handle">${l.handle}</span></span>\n\t\t\t\t\t${l.date?`<a href="${l.permalink}" class="tweet-date">${l.date}</a>`:""}\n\t\t\t\t</div>\n\t\t\t\t${a?`<div class="tweet-text">${a}</div>`:""}\n\t\t\t\t${s.length?`\n\t\t\t\t\t<div class="tweet-media">\n\t\t\t\t\t\t${s.join("\n")}\n\t\t\t\t\t</div>\n\t\t\t\t`:""}\n\t\t\t\t${u?`\n\t\t\t\t\t<blockquote class="quoted-tweet">\n\t\t\t\t\t\t${u}\n\t\t\t\t\t</blockquote>\n\t\t\t\t`:""}\n\t\t\t</div>\n\t\t`.trim()}extractUserInfo(t){var e,r,n,o,i,a,s,l,c;const u=t.querySelector('[data-testid="User-Name"]');if(!u)return{fullName:"",handle:"",date:"",permalink:""};const d=u.querySelectorAll("a");let m=(null===(r=null===(e=null==d?void 0:d[0])||void 0===e?void 0:e.textContent)||void 0===r?void 0:r.trim())||"",h=(null===(o=null===(n=null==d?void 0:d[1])||void 0===n?void 0:n.textContent)||void 0===o?void 0:o.trim())||"";m&&h||(m=(null===(a=null===(i=u.querySelector('span[style*="color: rgb(15, 20, 25)"] span'))||void 0===i?void 0:i.textContent)||void 0===a?void 0:a.trim())||"",h=(null===(l=null===(s=u.querySelector('span[style*="color: rgb(83, 100, 113)"]'))||void 0===s?void 0:s.textContent)||void 0===l?void 0:l.trim())||"");const p=t.querySelector("time"),g=(null==p?void 0:p.getAttribute("datetime"))||"";return{fullName:m,handle:h,date:g?new Date(g).toISOString().split("T")[0]:"",permalink:(null===(c=null==p?void 0:p.closest("a"))||void 0===c?void 0:c.href)||""}}extractImages(t){var e,r;const n=['[data-testid="tweetPhoto"]','[data-testid="tweet-image"]','img[src*="media"]'],o=[],i=null===(r=null===(e=t.querySelector('[aria-labelledby*="id__"]'))||void 0===e?void 0:e.querySelector('[data-testid="User-Name"]'))||void 0===r?void 0:r.closest('[aria-labelledby*="id__"]');for(const e of n){t.querySelectorAll(e).forEach((t=>{var e,r;if(!(null==i?void 0:i.contains(t))&&"img"===t.tagName.toLowerCase()&&t.getAttribute("alt")){const n=(null===(e=t.getAttribute("src"))||void 0===e?void 0:e.replace(/&name=\w+$/,"&name=large"))||"",i=(null===(r=t.getAttribute("alt"))||void 0===r?void 0:r.replace(/\s+/g," ").trim())||"";o.push(`<img src="${n}" alt="${i}" />`)}}))}return o}getTweetId(){const t=this.url.match(/status\/(\d+)/);return(null==t?void 0:t[1])||""}getTweetAuthor(){var t,e,r;const n=null===(t=this.mainTweet)||void 0===t?void 0:t.querySelector('[data-testid="User-Name"]'),o=null==n?void 0:n.querySelectorAll("a"),i=(null===(r=null===(e=null==o?void 0:o[1])||void 0===e?void 0:e.textContent)||void 0===r?void 0:r.trim())||"";return i.startsWith("@")?i:`@${i}`}createDescription(t){var e;if(!t)return"";return((null===(e=t.querySelector('[data-testid="tweetText"]'))||void 0===e?void 0:e.textContent)||"").trim().slice(0,140).replace(/\s+/g," ")}}e.TwitterExtractor=o},258:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.YoutubeExtractor=void 0;const n=r(279);class o extends n.BaseExtractor{constructor(t,e,r){super(t,e,r),this.videoElement=t.querySelector("video"),this.schemaOrgData=r}canExtract(){return!0}extract(){const t=this.getVideoData(),e=t.description||"",r=this.formatDescription(e),n=`<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.getVideoId()}?si=_m0qv33lAuJFoGNh" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>${r}`;return{content:n,contentHtml:n,extractedContent:{videoId:this.getVideoId(),author:t.author||""},variables:{title:t.name||"",author:t.author||"",site:"YouTube",image:Array.isArray(t.thumbnailUrl)&&t.thumbnailUrl[0]||"",published:t.uploadDate,description:e.slice(0,200).trim()}}}formatDescription(t){return`<p>${t.replace(/\n/g,"<br>")}</p>`}getVideoData(){if(!this.schemaOrgData)return{};return(Array.isArray(this.schemaOrgData)?this.schemaOrgData.find((t=>"VideoObject"===t["@type"])):"VideoObject"===this.schemaOrgData["@type"]?this.schemaOrgData:null)||{}}getVideoId(){return new URLSearchParams(new URL(this.url).search).get("v")||""}}e.YoutubeExtractor=o},279:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.BaseExtractor=void 0;e.BaseExtractor=class{constructor(t,e,r){this.document=t,this.url=e,this.schemaOrgData=r}}},282:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.mathSelectors=e.isBlockDisplay=e.getBasicLatexFromElement=e.getMathMLFromElement=void 0;e.getMathMLFromElement=t=>{if("math"===t.tagName.toLowerCase()){const e="block"===t.getAttribute("display");return{mathml:t.outerHTML,latex:t.getAttribute("alttext")||null,isBlock:e}}const e=t.getAttribute("data-mathml");if(e){const t=document.createElement("div");t.innerHTML=e;const r=t.querySelector("math");if(r){const t="block"===r.getAttribute("display");return{mathml:r.outerHTML,latex:r.getAttribute("alttext")||null,isBlock:t}}}const r=t.querySelector(".MJX_Assistive_MathML, mjx-assistive-mml");if(r){const t=r.querySelector("math");if(t){const e=t.getAttribute("display"),n=r.getAttribute("display"),o="block"===e||"block"===n;return{mathml:t.outerHTML,latex:t.getAttribute("alttext")||null,isBlock:o}}}const n=t.querySelector(".katex-mathml math");return n?{mathml:n.outerHTML,latex:null,isBlock:!1}:null};e.getBasicLatexFromElement=t=>{var e,r,n;const o=t.getAttribute("data-latex");if(o)return o;if("img"===t.tagName.toLowerCase()&&t.classList.contains("latex")){const e=t.getAttribute("alt");if(e)return e;const r=t.getAttribute("src");if(r){const t=r.match(/latex\.php\?latex=([^&]+)/);if(t)return decodeURIComponent(t[1]).replace(/\+/g," ").replace(/%5C/g,"\\")}}const i=t.querySelector('annotation[encoding="application/x-tex"]');if(null==i?void 0:i.textContent)return i.textContent.trim();if(t.matches(".katex")){const e=t.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');if(null==e?void 0:e.textContent)return e.textContent.trim()}if(t.matches('script[type="math/tex"]')||t.matches('script[type="math/tex; mode=display"]'))return(null===(e=t.textContent)||void 0===e?void 0:e.trim())||null;if(t.parentElement){const e=t.parentElement.querySelector('script[type="math/tex"], script[type="math/tex; mode=display"]');if(e)return(null===(r=e.textContent)||void 0===r?void 0:r.trim())||null}return t.getAttribute("alt")||(null===(n=t.textContent)||void 0===n?void 0:n.trim())||null};e.isBlockDisplay=t=>{if("block"===t.getAttribute("display"))return!0;const e=t.className.toLowerCase();if(e.includes("display")||e.includes("block"))return!0;if(t.closest('.katex-display, .MathJax_Display, [data-display="block"]'))return!0;const r=t.previousElementSibling;if("p"===(null==r?void 0:r.tagName.toLowerCase()))return!0;if(t.matches(".mwe-math-fallback-image-display"))return!0;if(t.matches(".katex"))return null!==t.closest(".katex-display");if(t.hasAttribute("display"))return"true"===t.getAttribute("display");if(t.matches('script[type="math/tex; mode=display"]'))return!0;if(t.hasAttribute("display"))return"true"===t.getAttribute("display");const n=t.closest("[display]");return!!n&&"true"===n.getAttribute("display")},e.mathSelectors=['img.latex[src*="latex.php"]',"span.MathJax","mjx-container",'script[type="math/tex"]','script[type="math/tex; mode=display"]','.MathJax_Preview + script[type="math/tex"]',".MathJax_Display",".MathJax_SVG",".MathJax_MathML",".mwe-math-element",".mwe-math-fallback-image-inline",".mwe-math-fallback-image-display",".mwe-math-mathml-inline",".mwe-math-mathml-display",".katex",".katex-display",".katex-mathml",".katex-html","[data-katex]",'script[type="math/katex"]',"math","[data-math]","[data-latex]","[data-tex]",'script[type^="math/"]','annotation[encoding="application/x-tex"]'].join(",")},397:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.ClaudeExtractor=void 0;const n=r(181);class o extends n.ConversationExtractor{constructor(t,e){super(t,e),this.articles=t.querySelectorAll('div[data-testid="user-message"], div[data-testid="assistant-message"], div.font-claude-message')}canExtract(){return!!this.articles&&this.articles.length>0}extractMessages(){const t=[];return this.articles?(this.articles.forEach((e=>{let r,n;if(e.hasAttribute("data-testid")){if("user-message"!==e.getAttribute("data-testid"))return;r="you",n=e.innerHTML}else{if(!e.classList.contains("font-claude-message"))return;r="assistant",n=e.innerHTML}n&&t.push({author:"you"===r?"You":"Claude",content:n.trim(),metadata:{role:r}})})),t):t}getMetadata(){const t=this.getTitle(),e=this.extractMessages();return{title:t,site:"Claude",url:this.url,messageCount:e.length,description:`Claude conversation with ${e.length} messages`}}getTitle(){var t,e,r,n,o;const i=null===(t=this.document.title)||void 0===t?void 0:t.trim();if(i&&"Claude"!==i)return i.replace(/ - Claude$/,"");const a=null===(r=null===(e=this.document.querySelector("header .font-tiempos"))||void 0===e?void 0:e.textContent)||void 0===r?void 0:r.trim();if(a)return a;const s=null===(o=null===(n=this.articles)||void 0===n?void 0:n.item(0))||void 0===o?void 0:o.querySelector('[data-testid="user-message"]');if(s){const t=s.textContent||"";return t.length>50?t.slice(0,50)+"...":t}return"Claude Conversation"}}e.ClaudeExtractor=o},458:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.HackerNewsExtractor=void 0;const n=r(279);class o extends n.BaseExtractor{constructor(t,e){super(t,e),this.mainPost=t.querySelector(".fatitem"),this.isCommentPage=this.detectCommentPage(),this.mainComment=this.isCommentPage?this.findMainComment():null}detectCommentPage(){var t;return!!(null===(t=this.mainPost)||void 0===t?void 0:t.querySelector('.navs a[href*="parent"]'))}findMainComment(){var t;return(null===(t=this.mainPost)||void 0===t?void 0:t.querySelector(".comment"))||null}canExtract(){return!!this.mainPost}extract(){const t=this.getPostContent(),e=this.extractComments(),r=this.createContentHtml(t,e),n=this.getPostTitle(),o=this.getPostAuthor(),i=this.createDescription(),a=this.getPostDate();return{content:r,contentHtml:r,extractedContent:{postId:this.getPostId(),postAuthor:o},variables:{title:n,author:o,site:"Hacker News",description:i,published:a}}}createContentHtml(t,e){return`\n\t\t\t<div class="hackernews-post">\n\t\t\t\t<div class="post-content">\n\t\t\t\t\t${t}\n\t\t\t\t</div>\n\t\t\t\t${e?`\n\t\t\t\t\t<hr>\n\t\t\t\t\t<h2>Comments</h2>\n\t\t\t\t\t<div class="hackernews-comments">\n\t\t\t\t\t\t${e}\n\t\t\t\t\t</div>\n\t\t\t\t`:""}\n\t\t\t</div>\n\t\t`.trim()}getPostContent(){var t,e,r,n,o,i;if(!this.mainPost)return"";if(this.isCommentPage&&this.mainComment){const i=(null===(t=this.mainComment.querySelector(".hnuser"))||void 0===t?void 0:t.textContent)||"[deleted]",a=(null===(e=this.mainComment.querySelector(".commtext"))||void 0===e?void 0:e.innerHTML)||"",s=this.mainComment.querySelector(".age"),l=((null==s?void 0:s.getAttribute("title"))||"").split("T")[0]||"",c=(null===(n=null===(r=this.mainComment.querySelector(".score"))||void 0===r?void 0:r.textContent)||void 0===n?void 0:n.trim())||"",u=(null===(o=this.mainPost.querySelector('.navs a[href*="parent"]'))||void 0===o?void 0:o.getAttribute("href"))||"";return`\n\t\t\t\t<div class="comment main-comment">\n\t\t\t\t\t<div class="comment-metadata">\n\t\t\t\t\t\t<span class="comment-author"><strong>${i}</strong></span> \u2022\n\t\t\t\t\t\t<span class="comment-date">${l}</span>\n\t\t\t\t\t\t${c?` \u2022 <span class="comment-points">${c}</span>`:""}\n\t\t\t\t\t\t${u?` \u2022 <a href="https://news.ycombinator.com/${u}" class="parent-link">parent</a>`:""}\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class="comment-content">${a}</div>\n\t\t\t\t</div>\n\t\t\t`.trim()}const a=this.mainPost.querySelector("tr.athing"),s=(null==a||a.nextElementSibling,(null===(i=null==a?void 0:a.querySelector(".titleline a"))||void 0===i?void 0:i.getAttribute("href"))||"");let l="";s&&(l+=`<p><a href="${s}" target="_blank">${s}</a></p>`);const c=this.mainPost.querySelector(".toptext");return c&&(l+=`<div class="post-text">${c.innerHTML}</div>`),l}extractComments(){const t=Array.from(this.document.querySelectorAll("tr.comtr"));return this.processComments(t)}processComments(t){var e,r,n,o;let i="";const a=new Set;let s=-1,l=[];for(const c of t){const t=c.getAttribute("id");if(!t||a.has(t))continue;a.add(t);const u=(null===(e=c.querySelector(".ind img"))||void 0===e?void 0:e.getAttribute("width"))||"0",d=parseInt(u)/40,m=c.querySelector(".commtext"),h=(null===(r=c.querySelector(".hnuser"))||void 0===r?void 0:r.textContent)||"[deleted]",p=c.querySelector(".age"),g=(null===(o=null===(n=c.querySelector(".score"))||void 0===n?void 0:n.textContent)||void 0===o?void 0:o.trim())||"";if(!m)continue;const f=`https://news.ycombinator.com/item?id=${t}`,v=((null==p?void 0:p.getAttribute("title"))||"").split("T")[0]||"";if(0===d){for(;l.length>0;)i+="</blockquote>",l.pop();i+="<blockquote>",l=[0],s=0}else if(d<s)for(;l.length>0&&l[l.length-1]>=d;)i+="</blockquote>",l.pop();else d>s&&(i+="<blockquote>",l.push(d));i+=`<div class="comment">\n\t<div class="comment-metadata">\n\t\t<span class="comment-author"><strong>${h}</strong></span> \u2022\n\t\t<a href="${f}" class="comment-link">${v}</a>\n\t\t${g?` \u2022 <span class="comment-points">${g}</span>`:""}\n\t</div>\n\t<div class="comment-content">${m.innerHTML}</div>\n</div>`,s=d}for(;l.length>0;)i+="</blockquote>",l.pop();return i}getPostId(){const t=this.url.match(/id=(\d+)/);return(null==t?void 0:t[1])||""}getPostTitle(){var t,e,r,n,o;if(this.isCommentPage&&this.mainComment){const r=(null===(t=this.mainComment.querySelector(".hnuser"))||void 0===t?void 0:t.textContent)||"[deleted]",n=(null===(e=this.mainComment.querySelector(".commtext"))||void 0===e?void 0:e.textContent)||"";return`Comment by ${r}: ${n.trim().slice(0,50)+(n.length>50?"...":"")}`}return(null===(o=null===(n=null===(r=this.mainPost)||void 0===r?void 0:r.querySelector(".titleline"))||void 0===n?void 0:n.textContent)||void 0===o?void 0:o.trim())||""}getPostAuthor(){var t,e,r;return(null===(r=null===(e=null===(t=this.mainPost)||void 0===t?void 0:t.querySelector(".hnuser"))||void 0===e?void 0:e.textContent)||void 0===r?void 0:r.trim())||""}createDescription(){const t=this.getPostTitle(),e=this.getPostAuthor();return this.isCommentPage?`Comment by ${e} on Hacker News`:`${t} - by ${e} on Hacker News`}getPostDate(){if(!this.mainPost)return"";const t=this.mainPost.querySelector(".age");return((null==t?void 0:t.getAttribute("title"))||"").split("T")[0]||""}}e.HackerNewsExtractor=o},552:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.isElement=function(t){return t.nodeType===r.ELEMENT_NODE},e.isTextNode=function(t){return t.nodeType===r.TEXT_NODE},e.isCommentNode=function(t){return t.nodeType===r.COMMENT_NODE},e.getComputedStyle=function(t){const e=n(t.ownerDocument);return e?e.getComputedStyle(t):null},e.getWindow=n,e.logDebug=function(t,...e){"undefined"!=typeof window&&window.defuddleDebug&&console.log("Defuddle:",t,...e)};const r={ELEMENT_NODE:1,ATTRIBUTE_NODE:2,TEXT_NODE:3,CDATA_SECTION_NODE:4,ENTITY_REFERENCE_NODE:5,ENTITY_NODE:6,PROCESSING_INSTRUCTION_NODE:7,COMMENT_NODE:8,DOCUMENT_NODE:9,DOCUMENT_TYPE_NODE:10,DOCUMENT_FRAGMENT_NODE:11,NOTATION_NODE:12};function n(t){return t.defaultView?t.defaultView:t.ownerWindow?t.ownerWindow:t.window?t.window:null}},608:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.MetadataExtractor=void 0;e.MetadataExtractor=class{static extract(t,e,r){var n,o;let i="",a="";try{if(a=(null===(n=t.location)||void 0===n?void 0:n.href)||"",a||(a=this.getMetaContent(r,"property","og:url")||this.getMetaContent(r,"property","twitter:url")||this.getSchemaProperty(e,"url")||this.getSchemaProperty(e,"mainEntityOfPage.url")||this.getSchemaProperty(e,"mainEntity.url")||this.getSchemaProperty(e,"WebSite.url")||(null===(o=t.querySelector('link[rel="canonical"]'))||void 0===o?void 0:o.getAttribute("href"))||""),a)try{i=new URL(a).hostname.replace(/^www\./,"")}catch(t){console.warn("Failed to parse URL:",t)}}catch(e){const r=t.querySelector("base[href]");if(r)try{a=r.getAttribute("href")||"",i=new URL(a).hostname.replace(/^www\./,"")}catch(t){console.warn("Failed to parse base URL:",t)}}return{title:this.getTitle(t,e,r),description:this.getDescription(t,e,r),domain:i,favicon:this.getFavicon(t,a,r),image:this.getImage(t,e,r),published:this.getPublished(t,e,r),author:this.getAuthor(t,e,r),site:this.getSite(t,e,r),schemaOrgData:e,wordCount:0,parseTime:0}}static getAuthor(t,e,r){let n;if(n=this.getMetaContent(r,"name","sailthru.author")||this.getMetaContent(r,"property","author")||this.getMetaContent(r,"name","author")||this.getMetaContent(r,"name","byl")||this.getMetaContent(r,"name","authorList"),n)return n;let o=this.getSchemaProperty(e,"author.name")||this.getSchemaProperty(e,"author.[].name");if(o){const t=o.split(",").map((t=>t.trim().replace(/,$/,"").trim())).filter(Boolean);if(t.length>0){let e=[...new Set(t)];return e.length>10&&(e=e.slice(0,10)),e.join(", ")}}const i=[];if(['[itemprop="author"]',".author",'[href*="author"]',".authors a"].forEach((e=>{t.querySelectorAll(e).forEach((t=>{var e;(e=t.textContent)&&e.split(",").forEach((t=>{const e=t.trim().replace(/,$/,"").trim(),r=e.toLowerCase();e&&"author"!==r&&"authors"!==r&&i.push(e)}))}))})),i.length>0){let t=[...new Set(i.map((t=>t.trim())).filter(Boolean))];if(t.length>0)return t.length>10&&(t=t.slice(0,10)),t.join(", ")}return n=this.getMetaContent(r,"name","copyright")||this.getSchemaProperty(e,"copyrightHolder.name")||this.getMetaContent(r,"property","og:site_name")||this.getSchemaProperty(e,"publisher.name")||this.getSchemaProperty(e,"sourceOrganization.name")||this.getSchemaProperty(e,"isPartOf.name")||this.getMetaContent(r,"name","twitter:creator")||this.getMetaContent(r,"name","application-name"),n||""}static getSite(t,e,r){return this.getSchemaProperty(e,"publisher.name")||this.getMetaContent(r,"property","og:site_name")||this.getSchemaProperty(e,"WebSite.name")||this.getSchemaProperty(e,"sourceOrganization.name")||this.getMetaContent(r,"name","copyright")||this.getSchemaProperty(e,"copyrightHolder.name")||this.getSchemaProperty(e,"isPartOf.name")||this.getMetaContent(r,"name","application-name")||this.getAuthor(t,e,r)||""}static getTitle(t,e,r){var n,o;const i=this.getMetaContent(r,"property","og:title")||this.getMetaContent(r,"name","twitter:title")||this.getSchemaProperty(e,"headline")||this.getMetaContent(r,"name","title")||this.getMetaContent(r,"name","sailthru.title")||(null===(o=null===(n=t.querySelector("title"))||void 0===n?void 0:n.textContent)||void 0===o?void 0:o.trim())||"";return this.cleanTitle(i,this.getSite(t,e,r))}static cleanTitle(t,e){if(!t||!e)return t;const r=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),n=[`\\s*[\\|\\-\u2013\u2014]\\s*${r}\\s*$`,`^\\s*${r}\\s*[\\|\\-\u2013\u2014]\\s*`];for(const e of n){const r=new RegExp(e,"i");if(r.test(t)){t=t.replace(r,"");break}}return t.trim()}static getDescription(t,e,r){return this.getMetaContent(r,"name","description")||this.getMetaContent(r,"property","description")||this.getMetaContent(r,"property","og:description")||this.getSchemaProperty(e,"description")||this.getMetaContent(r,"name","twitter:description")||this.getMetaContent(r,"name","sailthru.description")||""}static getImage(t,e,r){return this.getMetaContent(r,"property","og:image")||this.getMetaContent(r,"name","twitter:image")||this.getSchemaProperty(e,"image.url")||this.getMetaContent(r,"name","sailthru.image.full")||""}static getFavicon(t,e,r){var n,o;const i=this.getMetaContent(r,"property","og:image:favicon");if(i)return i;const a=null===(n=t.querySelector("link[rel='icon']"))||void 0===n?void 0:n.getAttribute("href");if(a)return a;const s=null===(o=t.querySelector("link[rel='shortcut icon']"))||void 0===o?void 0:o.getAttribute("href");if(s)return s;if(e)try{return new URL("/favicon.ico",e).href}catch(t){console.warn("Failed to construct favicon URL:",t)}return""}static getPublished(t,e,r){var n,o;return this.getSchemaProperty(e,"datePublished")||this.getMetaContent(r,"name","publishDate")||this.getMetaContent(r,"property","article:published_time")||(null===(o=null===(n=t.querySelector('abbr[itemprop="datePublished"]'))||void 0===n?void 0:n.title)||void 0===o?void 0:o.trim())||this.getTimeElement(t)||this.getMetaContent(r,"name","sailthru.date")||""}static getMetaContent(t,e,r){var n,o;const i=t.find((t=>{const n="name"===e?t.name:t.property;return(null==n?void 0:n.toLowerCase())===r.toLowerCase()}));return i&&null!==(o=null===(n=i.content)||void 0===n?void 0:n.trim())&&void 0!==o?o:""}static getTimeElement(t){var e,r,n,o;const i=Array.from(t.querySelectorAll("time"))[0];return i&&null!==(o=null!==(r=null===(e=i.getAttribute("datetime"))||void 0===e?void 0:e.trim())&&void 0!==r?r:null===(n=i.textContent)||void 0===n?void 0:n.trim())&&void 0!==o?o:""}static getSchemaProperty(t,e,r=""){if(!t)return r;const n=(t,e,r,o=!0)=>{if("string"==typeof t)return 0===e.length?[t]:[];if(!t||"object"!=typeof t)return[];if(Array.isArray(t)){const i=e[0];if(/^\\[\\d+\\]$/.test(i)){const a=parseInt(i.slice(1,-1));return t[a]?n(t[a],e.slice(1),r,o):[]}return 0===e.length&&t.every((t=>"string"==typeof t||"number"==typeof t))?t.map(String):t.flatMap((t=>n(t,e,r,o)))}const[i,...a]=e;if(!i)return"string"==typeof t?[t]:"object"==typeof t&&t.name?[t.name]:[];if(t.hasOwnProperty(i))return n(t[i],a,r?`${r}.${i}`:i,!0);if(!o){const o=[];for(const i in t)if("object"==typeof t[i]){const a=n(t[i],e,r?`${r}.${i}`:i,!1);o.push(...a)}if(o.length>0)return o}return[]};try{let o=n(t,e.split("."),"",!0);0===o.length&&(o=n(t,e.split("."),"",!1));return o.length>0?o.filter(Boolean).join(", "):r}catch(t){return console.error(`Error in getSchemaProperty for ${e}:`,t),r}}}},610:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.standardizeFootnotes=function(t){const e=t.ownerDocument;if(!e)return void console.warn("standardizeFootnotes: No document available");new o(e).standardizeFootnotes(t)};const n=r(640);class o{constructor(t){this.doc=t}createFootnoteItem(t,e,r){const n="string"==typeof e?this.doc:e.ownerDocument,o=n.createElement("li");if(o.className="footnote",o.id=`fn:${t}`,"string"==typeof e){const t=n.createElement("p");t.innerHTML=e,o.appendChild(t)}else{const t=Array.from(e.querySelectorAll("p"));if(0===t.length){const t=n.createElement("p");t.innerHTML=e.innerHTML,o.appendChild(t)}else t.forEach((t=>{const e=n.createElement("p");e.innerHTML=t.innerHTML,o.appendChild(e)}))}const i=o.querySelector("p:last-of-type")||o;return r.forEach(((t,e)=>{const o=n.createElement("a");o.href=`#${t}`,o.title="return to article",o.className="footnote-backref",o.innerHTML="\u21a9",e<r.length-1&&(o.innerHTML+=" "),i.appendChild(o)})),o}collectFootnotes(t){const e={};let r=1;const o=new Set;return t.querySelectorAll(n.FOOTNOTE_LIST_SELECTORS).forEach((t=>{if(t.matches('div.footnote[data-component-name="FootnoteToDOM"]')){const n=t.querySelector("a.footnote-number"),i=t.querySelector(".footnote-content");if(n&&i){const t=n.id.replace("footnote-","").toLowerCase();t&&!o.has(t)&&(e[r]={content:i,originalId:t,refs:[]},o.add(t),r++)}return}t.querySelectorAll('li, div[role="listitem"]').forEach((t=>{var n,i,a,s;let l="",c=null;const u=t.querySelector(".citations");if(null===(n=null==u?void 0:u.id)||void 0===n?void 0:n.toLowerCase().startsWith("r")){l=u.id.toLowerCase();const t=u.querySelector(".citation-content");t&&(c=t)}else{if(t.id.toLowerCase().startsWith("bib.bib"))l=t.id.replace("bib.bib","").toLowerCase();else if(t.id.toLowerCase().startsWith("fn:"))l=t.id.replace("fn:","").toLowerCase();else if(t.id.toLowerCase().startsWith("fn"))l=t.id.replace("fn","").toLowerCase();else if(t.hasAttribute("data-counter"))l=(null===(a=null===(i=t.getAttribute("data-counter"))||void 0===i?void 0:i.replace(/\.$/,""))||void 0===a?void 0:a.toLowerCase())||"";else{const e=null===(s=t.id.split("/").pop())||void 0===s?void 0:s.match(/cite_note-(.+)/);l=e?e[1].toLowerCase():t.id.toLowerCase()}c=t}l&&!o.has(l)&&(e[r]={content:c||t,originalId:l,refs:[]},o.add(l),r++)}))})),e}findOuterFootnoteContainer(t){let e=t,r=t.parentElement;for(;r&&("span"===r.tagName.toLowerCase()||"sup"===r.tagName.toLowerCase());)e=r,r=r.parentElement;return e}createFootnoteReference(t,e){const r=this.doc.createElement("sup");r.id=e;const n=this.doc.createElement("a");return n.href=`#fn:${t}`,n.textContent=t,r.appendChild(n),r}standardizeFootnotes(t){const e=this.collectFootnotes(t),r=t.querySelectorAll(n.FOOTNOTE_INLINE_REFERENCES),o=new Map;r.forEach((t=>{var r,n,i,a;if(!t)return;let s="",l="";if(t.matches('a[id^="ref-link"]'))s=(null===(r=t.textContent)||void 0===r?void 0:r.trim())||"";else if(t.matches('a[role="doc-biblioref"]')){const e=t.getAttribute("data-xml-rid");if(e)s=e;else{const e=t.getAttribute("href");(null==e?void 0:e.startsWith("#core-R"))&&(s=e.replace("#core-",""))}}else if(t.matches("a.footnote-anchor, span.footnote-hovercard-target a")){const e=(null===(n=t.id)||void 0===n?void 0:n.replace("footnote-anchor-",""))||"";e&&(s=e.toLowerCase())}else if(t.matches("cite.ltx_cite")){const e=t.querySelector("a");if(e){const t=e.getAttribute("href");if(t){const e=null===(i=t.split("/").pop())||void 0===i?void 0:i.match(/bib\.bib(\d+)/);e&&(s=e[1].toLowerCase())}}}else if(t.matches("sup.reference")){const e=t.querySelectorAll("a");Array.from(e).forEach((t=>{var e;const r=t.getAttribute("href");if(r){const t=null===(e=r.split("/").pop())||void 0===e?void 0:e.match(/(?:cite_note|cite_ref)-(.+)/);t&&(s=t[1].toLowerCase())}}))}else if(t.matches('sup[id^="fnref:"]'))s=t.id.replace("fnref:","").toLowerCase();else if(t.matches('sup[id^="fnr"]'))s=t.id.replace("fnr","").toLowerCase();else if(t.matches("span.footnote-reference"))s=t.getAttribute("data-footnote-id")||"";else if(t.matches("span.footnote-link"))s=t.getAttribute("data-footnote-id")||"",l=t.getAttribute("data-footnote-content")||"";else if(t.matches("a.citation"))s=(null===(a=t.textContent)||void 0===a?void 0:a.trim())||"",l=t.getAttribute("href")||"";else if(t.matches('a[id^="fnref"]'))s=t.id.replace("fnref","").toLowerCase();else{const e=t.getAttribute("href");if(e){const t=e.replace(/^[#]/,"");s=t.toLowerCase()}}if(s){const r=Object.entries(e).find((([t,e])=>e.originalId===s.toLowerCase()));if(r){const[e,n]=r,i=n.refs.length>0?`fnref:${e}-${n.refs.length+1}`:`fnref:${e}`;n.refs.push(i);const a=this.findOuterFootnoteContainer(t);if("sup"===a.tagName.toLowerCase()){o.has(a)||o.set(a,[]);o.get(a).push(this.createFootnoteReference(e,i))}else a.replaceWith(this.createFootnoteReference(e,i))}}})),o.forEach(((t,e)=>{if(t.length>0){const r=this.doc.createDocumentFragment();t.forEach((t=>{const e=t.querySelector("a");if(e){const n=this.doc.createElement("sup");n.id=t.id,n.appendChild(e.cloneNode(!0)),r.appendChild(n)}})),e.replaceWith(r)}}));const i=this.doc.createElement("div");i.id="footnotes";const a=this.doc.createElement("ol");Object.entries(e).forEach((([t,e])=>{const r=this.createFootnoteItem(parseInt(t),e.content,e.refs);a.appendChild(r)}));t.querySelectorAll(n.FOOTNOTE_LIST_SELECTORS).forEach((t=>t.remove())),a.children.length>0&&(i.appendChild(a),t.appendChild(i))}}},628:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.Defuddle=void 0;const n=r(608),o=r(917),i=r(640),a=r(840),s=r(968),l=r(552);e.Defuddle=class{constructor(t,e={}){this.doc=t,this.options=e,this.debug=e.debug||!1}parse(){const t=this.parseInternal();if(t.wordCount<200){console.log("Initial parse returned very little content, trying again");const e=this.parseInternal({removePartialSelectors:!1});if(e.wordCount>t.wordCount)return this._log("Retry produced more content"),e}return t}parseInternal(t={}){var e,r,i;const l=Date.now(),c=Object.assign(Object.assign({removeExactSelectors:!0,removePartialSelectors:!0},this.options),t),u=this._extractSchemaOrgData(this.doc),d=[];this.doc.querySelectorAll("meta").forEach((t=>{const e=t.getAttribute("name"),r=t.getAttribute("property");let n=t.getAttribute("content");n&&d.push({name:e,property:r,content:this._decodeHTMLEntities(n)})}));const m=n.MetadataExtractor.extract(this.doc,u,d);try{const t=c.url||this.doc.URL,n=o.ExtractorRegistry.findExtractor(this.doc,t,u);if(n&&n.canExtract()){const t=n.extract(),o=Date.now();return{content:t.contentHtml,title:(null===(e=t.variables)||void 0===e?void 0:e.title)||m.title,description:m.description,domain:m.domain,favicon:m.favicon,image:m.image,published:(null===(r=t.variables)||void 0===r?void 0:r.published)||m.published,author:(null===(i=t.variables)||void 0===i?void 0:i.author)||m.author,site:m.site,schemaOrgData:m.schemaOrgData,wordCount:this.countWords(t.contentHtml),parseTime:Math.round(o-l),extractorType:n.constructor.name.replace("Extractor","").toLowerCase(),metaTags:d}}const h=this._evaluateMediaQueries(this.doc),p=this.findSmallImages(this.doc),g=this.doc.cloneNode(!0);this.applyMobileStyles(g,h);const f=this.findMainContent(g);if(!f){const t=Date.now();return Object.assign(Object.assign({content:this.doc.body.innerHTML},m),{wordCount:this.countWords(this.doc.body.innerHTML),parseTime:Math.round(t-l),metaTags:d})}this.removeSmallImages(g,p),this.removeHiddenElements(g),s.ContentScorer.scoreAndRemove(g,this.debug),(c.removeExactSelectors||c.removePartialSelectors)&&this.removeBySelector(g,c.removeExactSelectors,c.removePartialSelectors),(0,a.standardizeContent)(f,m,this.doc,this.debug);const v=f.outerHTML,b=Date.now();return Object.assign(Object.assign({content:v},m),{wordCount:this.countWords(v),parseTime:Math.round(b-l),metaTags:d})}catch(t){console.error("Defuddle","Error processing document:",t);const e=Date.now();return Object.assign(Object.assign({content:this.doc.body.innerHTML},m),{wordCount:this.countWords(this.doc.body.innerHTML),parseTime:Math.round(e-l),metaTags:d})}}countWords(t){const e=this.doc.createElement("div");e.innerHTML=t;return(e.textContent||"").trim().replace(/\s+/g," ").split(" ").filter((t=>t.length>0)).length}_log(...t){this.debug&&console.log("Defuddle:",...t)}_evaluateMediaQueries(t){const e=[],r=/max-width[^:]*:\s*(\d+)/;try{const n=Array.from(t.styleSheets).filter((t=>{try{return t.cssRules,!0}catch(t){return t instanceof DOMException&&t.name,!1}}));n.flatMap((t=>{try{return"undefined"==typeof CSSMediaRule?[]:Array.from(t.cssRules).filter((t=>t instanceof CSSMediaRule&&t.conditionText.includes("max-width")))}catch(t){return this.debug&&console.warn("Defuddle: Failed to process stylesheet:",t),[]}})).forEach((t=>{const n=t.conditionText.match(r);if(n){const r=parseInt(n[1]);if(i.MOBILE_WIDTH<=r){Array.from(t.cssRules).filter((t=>t instanceof CSSStyleRule)).forEach((t=>{try{e.push({selector:t.selectorText,styles:t.style.cssText})}catch(t){this.debug&&console.warn("Defuddle: Failed to process CSS rule:",t)}}))}}}))}catch(t){console.error("Defuddle: Error evaluating media queries:",t)}return e}applyMobileStyles(t,e){e.forEach((({selector:e,styles:r})=>{try{t.querySelectorAll(e).forEach((t=>{t.setAttribute("style",(t.getAttribute("style")||"")+r)}))}catch(t){console.error("Defuddle","Error applying styles for selector:",e,t)}}))}removeHiddenElements(t){let e=0;const r=new Set,n=Array.from(t.getElementsByTagName("*"));for(let o=0;o<n.length;o+=100){const i=n.slice(o,o+100),a=i.map((e=>{var r,n;try{return null===(r=e.ownerDocument.defaultView)||void 0===r?void 0:r.getComputedStyle(e)}catch(r){const o=e.getAttribute("style");if(!o)return null;const i=t.createElement("style");i.textContent=`* { ${o} }`,t.head.appendChild(i);const a=null===(n=e.ownerDocument.defaultView)||void 0===n?void 0:n.getComputedStyle(e);return t.head.removeChild(i),a}}));i.forEach(((t,n)=>{const o=a[n];!o||"none"!==o.display&&"hidden"!==o.visibility&&"0"!==o.opacity||(r.add(t),e++)}))}this._log("Removed hidden elements:",e)}removeBySelector(t,e=!0,r=!0){const n=Date.now();let o=0,a=0;const s=new Set;if(e){t.querySelectorAll(i.EXACT_SELECTORS.join(",")).forEach((t=>{(null==t?void 0:t.parentNode)&&(s.add(t),o++)}))}if(r){const e=i.PARTIAL_SELECTORS.join("|"),r=new RegExp(e,"i"),n=i.TEST_ATTRIBUTES.map((t=>`[${t}]`)).join(",");t.querySelectorAll(n).forEach((t=>{if(s.has(t))return;const e=i.TEST_ATTRIBUTES.map((e=>"class"===e?t.className&&"string"==typeof t.className?t.className:"":"id"===e?t.id||"":t.getAttribute(e)||"")).join(" ").toLowerCase();e.trim()&&r.test(e)&&(s.add(t),a++)}))}s.forEach((t=>t.remove()));const l=Date.now();this._log("Removed clutter elements:",{exactSelectors:o,partialSelectors:a,total:s.size,processingTime:`${(l-n).toFixed(2)}ms`})}findSmallImages(t){const e=new Set,r=/scale\(([\d.]+)\)/,n=Date.now();let o=0;const i=[...Array.from(t.getElementsByTagName("img")),...Array.from(t.getElementsByTagName("svg"))];if(0===i.length)return e;const a=i.map((t=>({element:t,naturalWidth:"img"===t.tagName.toLowerCase()&&parseInt(t.getAttribute("width")||"0")||0,naturalHeight:"img"===t.tagName.toLowerCase()&&parseInt(t.getAttribute("height")||"0")||0,attrWidth:parseInt(t.getAttribute("width")||"0"),attrHeight:parseInt(t.getAttribute("height")||"0")})));for(let t=0;t<a.length;t+=50){const n=a.slice(t,t+50);try{const t=n.map((({element:t})=>{var e;try{return null===(e=t.ownerDocument.defaultView)||void 0===e?void 0:e.getComputedStyle(t)}catch(t){return null}})),i=n.map((({element:t})=>{try{return t.getBoundingClientRect()}catch(t){return null}}));n.forEach(((n,a)=>{var s;try{const l=t[a],c=i[a];if(!l)return;const u=l.transform,d=u?parseFloat((null===(s=u.match(r))||void 0===s?void 0:s[1])||"1"):1,m=[n.naturalWidth,n.attrWidth,parseInt(l.width)||0,c?c.width*d:0].filter((t=>"number"==typeof t&&t>0)),h=[n.naturalHeight,n.attrHeight,parseInt(l.height)||0,c?c.height*d:0].filter((t=>"number"==typeof t&&t>0));if(m.length>0&&h.length>0){const t=Math.min(...m),r=Math.min(...h);if(t<33||r<33){const t=this.getElementIdentifier(n.element);t&&(e.add(t),o++)}}}catch(t){this.debug&&console.warn("Defuddle: Failed to process element dimensions:",t)}}))}catch(t){this.debug&&console.warn("Defuddle: Failed to process batch:",t)}}const s=Date.now();return this._log("Found small elements:",{count:o,processingTime:`${(s-n).toFixed(2)}ms`}),e}removeSmallImages(t,e){let r=0;["img","svg"].forEach((n=>{const o=t.getElementsByTagName(n);Array.from(o).forEach((t=>{const n=this.getElementIdentifier(t);n&&e.has(n)&&(t.remove(),r++)}))})),this._log("Removed small elements:",r)}getElementIdentifier(t){if("img"===t.tagName.toLowerCase()){const e=t.getAttribute("data-src");if(e)return`src:${e}`;const r=t.getAttribute("src")||"",n=t.getAttribute("srcset")||"",o=t.getAttribute("data-srcset");if(r)return`src:${r}`;if(n)return`srcset:${n}`;if(o)return`srcset:${o}`}const e=t.id||"",r=t.className||"",n="svg"===t.tagName.toLowerCase()&&t.getAttribute("viewBox")||"";return e?`id:${e}`:n?`viewBox:${n}`:r?`class:${r}`:null}findMainContent(t){const e=[];if(i.ENTRY_POINT_ELEMENTS.forEach(((r,n)=>{t.querySelectorAll(r).forEach((t=>{let r=40*(i.ENTRY_POINT_ELEMENTS.length-n);r+=s.ContentScorer.scoreElement(t),e.push({element:t,score:r})}))})),0===e.length)return this.findContentByScoring(t);if(e.sort(((t,e)=>e.score-t.score)),this.debug&&this._log("Content candidates:",e.map((t=>({element:t.element.tagName,selector:this.getElementSelector(t.element),score:t.score})))),1===e.length&&"body"===e[0].element.tagName.toLowerCase()){const e=this.findTableBasedContent(t);if(e)return e}return e[0].element}findTableBasedContent(t){if(!Array.from(t.getElementsByTagName("table")).some((t=>{const e=parseInt(t.getAttribute("width")||"0"),r=this.getComputedStyle(t);return e>400||(null==r?void 0:r.width.includes("px"))&&parseInt(r.width)>400||"center"===t.getAttribute("align")||t.className.toLowerCase().includes("content")||t.className.toLowerCase().includes("article")})))return null;const e=Array.from(t.getElementsByTagName("td"));return s.ContentScorer.findBestElement(e)}findContentByScoring(t){const e=[];return i.BLOCK_ELEMENTS.forEach((r=>{Array.from(t.getElementsByTagName(r)).forEach((t=>{const r=s.ContentScorer.scoreElement(t);r>0&&e.push({score:r,element:t})}))})),e.length>0?e.sort(((t,e)=>e.score-t.score))[0].element:null}getElementSelector(t){const e=[];let r=t;for(;r&&r!==this.doc.documentElement;){let t=r.tagName.toLowerCase();r.id?t+="#"+r.id:r.className&&"string"==typeof r.className&&(t+="."+r.className.trim().split(/\s+/).join(".")),e.unshift(t),r=r.parentElement}return e.join(" > ")}getComputedStyle(t){return(0,l.getComputedStyle)(t)}_extractSchemaOrgData(t){const e=t.querySelectorAll('script[type="application/ld+json"]'),r=[];e.forEach((t=>{let e=t.textContent||"";try{e=e.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm,"").replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/,"$1").replace(/^\s*(\*\/|\/\*)\s*|\s*(\*\/|\/\*)\s*$/g,"").trim();const t=JSON.parse(e);t["@graph"]&&Array.isArray(t["@graph"])?r.push(...t["@graph"]):r.push(t)}catch(t){console.error("Defuddle: Error parsing schema.org data:",t),this.debug&&console.error("Defuddle: Problematic JSON content:",e)}}));const n=t=>{if("string"==typeof t)return this._decodeHTMLEntities(t);if(Array.isArray(t))return t.map(n);if("object"==typeof t&&null!==t){const e={};for(const r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=n(t[r]));return e}return t};return r.map(n)}_decodeHTMLEntities(t){const e=this.doc.createElement("textarea");return e.innerHTML=t,e.value}}},632:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.ChatGPTExtractor=void 0;const n=r(181);class o extends n.ConversationExtractor{constructor(t,e){super(t,e),this.articles=t.querySelectorAll('article[data-testid^="conversation-turn-"]'),this.footnotes=[],this.footnoteCounter=0}canExtract(){return!!this.articles&&this.articles.length>0}extractMessages(){const t=[];return this.footnotes=[],this.footnoteCounter=0,this.articles?(this.articles.forEach((e=>{var r,n;const o=e.querySelector("h5.sr-only, h6.sr-only"),i=(null===(n=null===(r=null==o?void 0:o.textContent)||void 0===r?void 0:r.trim())||void 0===n?void 0:n.replace(/:\s*$/,""))||"";let a="";const s=e.getAttribute("data-message-author-role");s&&(a=s);let l=e.innerHTML||"";l=l.replace(/\u200B/g,"");const c=document.createElement("div");c.innerHTML=l,c.querySelectorAll('h5.sr-only, h6.sr-only, span[data-state="closed"]').forEach((t=>t.remove())),l=c.innerHTML;l=l.replace(/(&ZeroWidthSpace;)?(<span[^>]*?>\s*<a(?=[^>]*?href="([^"]+)")(?=[^>]*?target="_blank")(?=[^>]*?rel="noopener")[^>]*?>[\s\S]*?<\/a>\s*<\/span>)/gi,((t,e,r,n)=>{let o="",i="";try{o=new URL(n).hostname.replace(/^www\./,"");const t=n.split("#:~:text=");if(t.length>1){i=decodeURIComponent(t[1]),i=i.replace(/%2C/g,",");const e=i.split(",");i=e.length>1&&e[0].trim()?` \u2014 ${e[0].trim()}...`:e[0].trim()?` \u2014 ${i.trim()}`:""}}catch(t){console.error(`Failed to parse URL: ${n}`,t),o=n}let a,s=this.footnotes.findIndex((t=>t.url===n));return-1===s?(this.footnoteCounter++,a=this.footnoteCounter,this.footnotes.push({url:n,text:`<a href="${n}">${o}</a>${i}`})):a=s+1,`<sup id="fnref:${a}"><a href="#fn:${a}">${a}</a></sup>`})),l=l.replace(/<p[^>]*>\s*<\/p>/g,""),t.push({author:i,content:l.trim(),metadata:{role:a||"unknown"}})})),t):t}getFootnotes(){return this.footnotes}getMetadata(){const t=this.getTitle(),e=this.extractMessages();return{title:t,site:"ChatGPT",url:this.url,messageCount:e.length,description:`ChatGPT conversation with ${e.length} messages`}}getTitle(){var t,e,r;const n=null===(t=this.document.title)||void 0===t?void 0:t.trim();if(n&&"ChatGPT"!==n)return n;const o=null===(r=null===(e=this.articles)||void 0===e?void 0:e.item(0))||void 0===r?void 0:r.querySelector(".text-message");if(o){const t=o.textContent||"";return t.length>50?t.slice(0,50)+"...":t}return"ChatGPT Conversation"}}e.ChatGPTExtractor=o},640:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.ALLOWED_ATTRIBUTES_DEBUG=e.ALLOWED_ATTRIBUTES=e.ALLOWED_EMPTY_ELEMENTS=e.FOOTNOTE_LIST_SELECTORS=e.FOOTNOTE_INLINE_REFERENCES=e.PARTIAL_SELECTORS=e.TEST_ATTRIBUTES=e.EXACT_SELECTORS=e.INLINE_ELEMENTS=e.PRESERVE_ELEMENTS=e.BLOCK_ELEMENTS=e.MOBILE_WIDTH=e.ENTRY_POINT_ELEMENTS=void 0,e.ENTRY_POINT_ELEMENTS=["#post",".post-content",".article-content","#article-content",".article_post",".article-wrapper",".entry-content",".content-article",".post",".markdown-body","article",'[role="article"]',"main",'[role="main"]',"body"],e.MOBILE_WIDTH=600,e.BLOCK_ELEMENTS=["div","section","article","main","aside","header","footer","nav","content"],e.PRESERVE_ELEMENTS=new Set(["pre","code","table","thead","tbody","tr","td","th","ul","ol","li","dl","dt","dd","figure","figcaption","picture","details","summary","blockquote","form","fieldset"]),e.INLINE_ELEMENTS=new Set(["a","span","strong","em","i","b","u","code","br","small","sub","sup","mark","date","del","ins","q","abbr","cite","relative-time","time","font"]),e.EXACT_SELECTORS=["noscript",'script:not([type^="math/"])',"style","meta","link",'.ad:not([class*="gradient"])','[class^="ad-" i]','[class$="-ad" i]','[id^="ad-" i]','[id$="-ad" i]','[role="banner" i]','[alt*="advert" i]',".promo",".Promo","#barrier-page",".alert",'[id="comments" i]','[id="comment" i]',"header",".header:not(.banner)","#header","#Header","#banner","#Banner","nav",".navigation","#navigation",".hero",'[role="navigation" i]','[role="dialog" i]','[role*="complementary" i]','[class*="pagination" i]',".menu","#menu","#siteSub",".previous",".author",".Author",'[class$="_bio"]',"#categories",".contributor",".date","#date","[data-date]",".entry-meta",".meta",".tags","#tags",".toc",".Toc","#toc",".headline","#headline","#title","#Title","#articleTag",'[href*="/category"]','[href*="/categories"]','[href*="/tag/"]','[href*="/tags/"]','[href*="/topics"]','[href*="author"]','[href*="#toc"]','[href="#top"]','[href="#Top"]','[href="#page-header"]','[href="#content"]','[href="#site-content"]','[href="#main-content"]','[href^="#main"]','[src*="author"]',"footer",".aside","aside","button","canvas","date","dialog","fieldset","form",'input:not([type="checkbox"])',"label","option","select","textarea","time","relative-time","[hidden]",'[aria-hidden="true"]:not([class*="math"])','[style*="display: none"]:not([class*="math"])','[style*="display:none"]:not([class*="math"])','[style*="visibility: hidden"]','[style*="visibility:hidden"]',".hidden",".invisible","instaread-player",'iframe:not([src*="youtube"]):not([src*="youtu.be"]):not([src*="vimeo"]):not([src*="twitter"]):not([src*="x.com"]):not([src*="datawrapper"])','[class="logo" i]',"#logo","#Logo","#newsletter","#Newsletter",".subscribe",".noprint",'[data-print-layout="hide" i]','[data-block="donotprint" i]','[class*="clickable-icon" i]','li span[class*="ltx_tag" i][class*="ltx_tag_item" i]','a[href^="#"][class*="anchor" i]','a[href^="#"][class*="ref" i]','[data-container*="most-viewed" i]',".sidebar",".Sidebar","#sidebar","#Sidebar","#sitesub",'[data-link-name*="skip" i]','[aria-label*="skip" i]',"#skip-link",".copyright","#copyright","#rss","#feed",".gutter","#primaryaudio","#NYT_ABOVE_MAIN_CONTENT_REGION",'[data-testid="photoviewer-children-figure"] > span',"table.infobox",".pencraft:not(.pc-display-contents)",'[data-optimizely="related-articles-section" i]','[data-orientation="vertical"]'],e.TEST_ATTRIBUTES=["class","id","data-test","data-testid","data-test-id","data-qa","data-cy"],e.PARTIAL_SELECTORS=["a-statement","access-wall","activitypub","actioncall","addcomment","advert","adlayout","ad-tldr","ad-placement","ads-container","_ad_","after_content","after_main_article","afterpost","allterms","-alert-","alert-box","appendix","_archive","around-the-web","aroundpages","article-author","article-badges","article-banner","article-bottom-section","article-bottom","article-category","article-card","article-citation","article__copy","article_date","article-date","article-end ","article_header","article-header","article__header","article__hero","article__info","article-info","article-meta","article_meta","article__meta","articlename","article-subject","article_subject","article-snippet","article-separator","article--share","article--topics","articletags","article-tags","article_tags","articletitle","article-title","article_title","articletopics","article-topics","article--lede","articlewell","associated-people","audio-card","author-bio","author-box","author-info","author_info","authorm","author-mini-bio","author-name","author-publish-info","authored-by","avatar","back-to-top","backlink_container","backlinks-section","bio-block","biobox","blog-pager","bookmark-","-bookmark","bottominfo","bottomnav","bottom-of-article","bottom-wrapper","brand-bar","breadcrumb","brdcrumb","button-wrapper","buttons-container","btn-","-btn","byline","captcha","card-text","card-media","card-post","carouselcontainer","carousel-container","cat_header","catlinks","_categories","card-author","card-content","chapter-list","collections","comments","commentbox","comment-button","commentcomp","comment-content","comment-count","comment-form","comment-number","comment-respond","comment-thread","comment-wrap","complementary","consent","contact-","content-card","content-topics","contentpromo","context-bar","context-widget","core-collateral","cover-","created-date","creative-commons_","c-subscribe","_cta","-cta","cta-","cta_","current-issue","custom-list-number","dateline","dateheader","date-header","date-pub","disclaimer","disclosure","discussion","discuss_","disqus","donate","donation","dropdown","eletters","emailsignup","engagement-widget","enhancement","entry-author-info","entry-categories","entry-date","entry-title","entry-utility","-error","error-","eyebrow","expand-reduce","external-anchor","externallinkembedwrapper","extra-services","extra-title","facebook","fancy-box","favorite","featured-content","feature_feed","feedback","feed-links","field-site-sections","fixheader","floating-vid","follower","footer","footnote-back","footnoteback","form-group","for-you","frontmatter","further-reading","fullbleedheader","gated-","gh-feed","gist-meta","goog-","graph-view","hamburger","header_logo","header-logo","header-pattern","hero-list","hide-for-print","hide-print","hide-when-no-script","hidden-print","hidden-sidenote","hidden-accessibility","infoline","instacartIntegration","interlude","interaction","itemendrow","invisible","jumplink","jump-to-","keepreading","keep-reading","keep_reading","keyword_wrap","kicker","labstab","-labels","language-name","lastupdated","latest-content","-ledes-","-license","license-","lightbox-popup","like-button","link-box","links-grid","links-title","listing-dynamic-terms","list-tags","listinks","loading","loa-info","logo_container","ltx_role_refnum","ltx_tag_bibitem","ltx_error","masthead","marketing","media-inquiry","-menu","menu-","metadata","might-like","minibio","more-about","_modal","-modal","more-","morenews","morestories","more_wrapper","most-read","move-helper","mw-editsection","mw-cite-backlink","mw-indicators","mw-jump-link","nav-","nav_","navigation-post","next-","newsgallery","news-story-title","newsletter_","newsletterbanner","newslettercontainer","newsletter-form","newsletter-signup","newslettersignup","newsletterwidget","newsletterwrapper","not-found","notessection","nomobile","noprint","open-slideshow","originally-published","other-blogs","outline-view","pagehead","page-header","page-title","paywall_message","-partners","permission-","plea","popular","popup_links","pop_stories","pop-up","post-author","post-bottom","post__category","postcomment","postdate","post-date","post_date","post-details","post-feeds","postinfo","post-info","post_info","post-inline-date","post-links","postlist","post_list","post_meta","post-meta","postmeta","post_more","postnavi","post-navigation","postpath","post-preview","postsnippet","post_snippet","post-snippet","post-subject","posttax","post-tax","post_tax","posttag","post_tag","post-tag","post_time","posttitle","post-title","post_title","post__title","post-ufi-button","prev-post","prevnext","prev_next","prev-next","previousnext","press-inquiries","print-none","print-header","print:hidden","privacy-notice","privacy-settings","profile","promo_article","promo-bar","promo-box","pubdate","pub_date","pub-date","publish_date","publish-date","publication-date","publicationName","qr-code","qr_code","quick_up","_rail","ratingssection","read_also","readmore","read-next","read_next","read_time","read-time","reading_time","reading-time","reading-list","recent-","recent-articles","recentpost","recent_post","recent-post","recommend","redirectedfrom","recirc","register","related","relevant","reversefootnote","_rss","rss-link","screen-reader-text","scroll_to","scroll-to","_search","-search","section-nav","series-banner","share-box","sharedaddy","share-icons","sharelinks","share-post","share-print","share-section","show-for-print","sidebartitle","sidebar-content","sidebar-wrapper","sideitems","sidebar-author","sidebar-item","side-box","side-logo","sign-in-gate","similar-","similar_","similars-","site-index","site-header","siteheader","site-logo","site-name","site-wordpress","skip-content","skip-to-content","c-skip-link","_skip-link","-slider","slug-wrap","social-author","social-shar","social-date","speechify-ignore","speedbump","sponsor","springercitation","sr-only","_stats","story-date","story-navigation","storyreadtime","storysmall","storypublishdate","subject-label","subhead","submenu","-subscribe-","subscriber-drive","subscription-","_tags","tags__item","tag_list","taxonomy","table-of-contents","tabs-","terminaltout","time-rubric","timestamp","time-read","time-to-read","tip_off","tiptout","-tout-","toc-container","toggle-caption","tooltip","topbar","topic-list","topic-subnav","top-wrapper","tree-item","trending","trust-feat","trust-badge","trust-project","twitter","u-hide","upsell","viewbottom","visually-hidden","welcomebox","widget_pages"],e.FOOTNOTE_INLINE_REFERENCES=["sup.reference","cite.ltx_cite",'sup[id^="fnr"]','span[id^="fnr"]','span[class*="footnote_ref"]',"span.footnote-link","a.citation",'a[id^="ref-link"]','a[href^="#fn"]','a[href^="#cite"]','a[href^="#reference"]','a[href^="#footnote"]','a[href^="#r"]','a[href^="#b"]','a[href*="cite_note"]','a[href*="cite_ref"]',"a.footnote-anchor","span.footnote-hovercard-target a",'a[role="doc-biblioref"]','a[id^="fnref"]','a[id^="ref-link"]'].join(","),e.FOOTNOTE_LIST_SELECTORS=["div.footnote ol","div.footnotes ol",'div[role="doc-endnotes"]','div[role="doc-footnotes"]',"ol.footnotes-list","ol.footnotes","ol.references",'ol[class*="article-references"]',"section.footnotes ol",'section[role="doc-endnotes"]','section[role="doc-footnotes"]','section[role="doc-bibliography"]',"ul.footnotes-list","ul.ltx_biblist",'div.footnote[data-component-name="FootnoteToDOM"]'].join(","),e.ALLOWED_EMPTY_ELEMENTS=new Set(["area","audio","base","br","circle","col","defs","ellipse","embed","figure","g","hr","iframe","img","input","line","link","mask","meta","object","param","path","pattern","picture","polygon","polyline","rect","source","stop","svg","td","th","track","use","video","wbr"]),e.ALLOWED_ATTRIBUTES=new Set(["alt","allow","allowfullscreen","aria-label","checked","colspan","controls","data-latex","data-src","data-srcset","data-lang","dir","display","frameborder","headers","height","href","lang","role","rowspan","src","srcset","title","type","width","accent","accentunder","align","columnalign","columnlines","columnspacing","columnspan","data-mjx-texclass","depth","displaystyle","fence","frame","framespacing","linethickness","lspace","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","rowalign","rowlines","rowspacing","rowspan","rspace","scriptlevel","separator","stretchy","symmetric","voffset","xmlns"]),e.ALLOWED_ATTRIBUTES_DEBUG=new Set(["class","id"])},649:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.imageRules=void 0;const n=r(552),o=/^data:image\/([^;]+);base64,/,i=/\.(jpg|jpeg|png|webp)\s+\d/,a=/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/,s=/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i,l=/\s(\d+)w/,c=/dpr=(\d+(?:\.\d+)?)/,u=/^([^\s]+)/,d=/^[\w\-\.\/\\]+\.(jpg|jpeg|png|gif|webp|svg)$/i,m=/^\d{4}-\d{2}-\d{2}$/;function h(t,e,r){const o=r.createElement("figure");o.appendChild(t.cloneNode(!0));const i=r.createElement("figcaption"),a=function(t){const e=[],r=new Set,o=t=>{var i;if((0,n.isTextNode)(t)){const n=(null===(i=t.textContent)||void 0===i?void 0:i.trim())||"";n&&!r.has(n)&&(e.push(n),r.add(n))}else if((0,n.isElement)(t)){const e=t.childNodes;for(let t=0;t<e.length;t++)o(e[t])}},i=t.childNodes;for(let t=0;t<i.length;t++)o(i[t]);if(e.length>0)return e.join(" ");return t.innerHTML}(e);return i.innerHTML=a,o.appendChild(i),o}function p(t,e){e.setAttribute("srcset",t);const r=A(t);r&&b(r)&&e.setAttribute("src",r)}function g(t,e,r){for(let n=0;n<t.attributes.length;n++){const o=t.attributes[n];r.includes(o.name)||e.setAttribute(o.name,o.value)}}function f(t){const e=t.match(o);if(!e)return!1;if("svg+xml"===e[1])return!1;const r=e[0].length;return t.length-r<133}function v(t){return t.startsWith("data:image/svg+xml")}function b(t){return!t.startsWith("data:")&&(!(!t||""===t.trim())&&(s.test(t)||t.includes("image")||t.includes("img")||t.includes("photo")))}function y(t){if(E(t))return!0;return t.querySelectorAll("img, video, picture, source").length>0}function E(t){const e=t.tagName.toLowerCase();return"img"===e||"video"===e||"picture"===e||"source"===e}function C(t){if(E(t))return t;const e=t.querySelectorAll("picture");if(e.length>0)return e[0];const r=t.querySelectorAll("img"),n=[];for(let t=0;t<r.length;t++){const e=r[t],o=e.getAttribute("src")||"",i=e.getAttribute("alt")||"";o.includes("data:image/svg+xml")||(f(o)||!i.trim()&&r.length>1||n.push(e))}if(n.length>0)return n[0];const o=t.querySelectorAll("video");if(o.length>0)return o[0];const i=t.querySelectorAll("source");if(i.length>0)return i[0];const a=t.querySelectorAll("img, picture, source, video");return a.length>0?a[0]:null}function w(t){var e,r,n,o;const i=t.querySelector("figcaption");if(i)return i;const a=new Set,s=['[class*="caption"]','[class*="description"]','[class*="alt"]','[class*="title"]','[class*="credit"]','[class*="text"]','[class*="post-thumbnail-text"]','[class*="image-caption"]','[class*="photo-caption"]',"[aria-label]","[title]"].join(", "),l=t.querySelectorAll(s);for(let t=0;t<l.length;t++){const r=l[t];if(E(r))continue;const n=null===(e=r.textContent)||void 0===e?void 0:e.trim();if(n&&n.length>0&&!a.has(n))return a.add(n),r}const c=t.querySelector("img");if(c&&c.hasAttribute("alt")){const e=c.getAttribute("alt");if(e&&e.trim().length>0){const r=t.ownerDocument.createElement("div");return r.textContent=e,r}}if(t.parentElement){const e=t.parentElement.children;for(let n=0;n<e.length;n++){const o=e[n];if(o===t)continue;if(Array.from(o.classList).some((t=>t.includes("caption")||t.includes("credit")||t.includes("text")||t.includes("description")))){const t=null===(r=o.textContent)||void 0===r?void 0:r.trim();if(t&&t.length>0)return o}}}const u=t.querySelectorAll("img");for(let t=0;t<u.length;t++){const e=u[t];if(!e.parentElement)continue;let r=e.nextElementSibling;for(;r;){if(["EM","STRONG","SPAN","I","B","SMALL","CITE"].includes(r.tagName)){const t=null===(n=r.textContent)||void 0===n?void 0:n.trim();if(t&&t.length>0)return r}r=r.nextElementSibling}}for(let t=0;t<u.length;t++){const e=u[t],r=e.parentElement;if(!r)continue;const n=r.querySelectorAll("em, strong, span, i, b, small, cite");for(let t=0;t<n.length;t++){const r=n[t];if(r===e)continue;const i=null===(o=r.textContent)||void 0===o?void 0:o.trim();if(i&&i.length>0)return r}}return null}function x(t){var e;const r=(null===(e=t.textContent)||void 0===e?void 0:e.trim())||"";return!(r.length<10||r.startsWith("http://")||r.startsWith("https://"))&&(!d.test(r)&&(!r.match(/^\d+$/)&&!m.test(r)))}function S(t,e){const r=t.tagName.toLowerCase();if("img"===r)return T(t,e);if("picture"===r){const r=t.querySelector("img");return r?T(r,e):t.cloneNode(!0)}return"source"===r?function(t,e){const r=e.createElement("img"),n=t.getAttribute("srcset");n&&p(n,r);const o=t.parentElement;if(o){const t=o.querySelectorAll("img"),e=[];for(let r=0;r<t.length;r++){const n=t[r],o=n.getAttribute("src")||"";f(o)||v(o)||""===o||e.push(n)}if(e.length>0){if(g(e[0],r,["src","srcset"]),!r.hasAttribute("src")||!b(r.getAttribute("src")||"")){const t=e[0].getAttribute("src");t&&b(t)&&r.setAttribute("src",t)}}else{const t=o.querySelector("img[data-src]");if(t&&(g(t,r,["src","srcset"]),!r.hasAttribute("src")||!b(r.getAttribute("src")||""))){const e=t.getAttribute("data-src");e&&b(e)&&r.setAttribute("src",e)}}}return r}(t,e):t.cloneNode(!0)}function T(t,e){const r=t.getAttribute("src")||"";if(f(r)||v(r)){const r=t.parentElement;if(r){const n=r.querySelectorAll("source"),o=[];for(let t=0;t<n.length;t++){const e=n[t];e.hasAttribute("data-srcset")&&""!==e.getAttribute("data-srcset")&&o.push(e)}if(o.length>0){const r=e.createElement("img"),n=t.getAttribute("data-src");return n&&!v(n)&&r.setAttribute("src",n),g(t,r,["src"]),r}}}return t.cloneNode(!0)}function A(t){const e=t.split(",");if(0===e.length)return null;const r=e[0].trim().match(u);if(r&&r[1]){const t=r[1];if(v(t)){for(let t=1;t<e.length;t++){const r=e[t].trim().match(u);if(r&&r[1]&&!v(r[1]))return r[1]}return null}return t}return null}function L(t){if(0===t.length)return null;if(1===t.length)return t[0];for(let e=0;e<t.length;e++)if(!t[e].hasAttribute("media"))return t[e];let e=null,r=0;for(let n=0;n<t.length;n++){const o=t[n],i=o.getAttribute("srcset");if(!i)continue;const a=i.match(l),s=i.match(c);if(a&&a[1]){const t=parseInt(a[1],10)*(s?parseFloat(s[1]):1);t>r&&(r=t,e=o)}}return e||t[0]}e.imageRules=[{selector:"picture",element:"picture",transform:(t,e)=>{const r=t.querySelectorAll("source"),n=t.querySelector("img");if(!n){console.warn("Picture element without img fallback:",t.outerHTML);const n=L(r);if(n){const r=n.getAttribute("srcset");if(r){const n=e.createElement("img");return p(r,n),t.innerHTML="",t.appendChild(n),t}}return t}let o=null,i=null;if(r.length>0){const t=L(r);t&&(o=t.getAttribute("srcset"),o&&(i=A(o)))}if(o&&n.setAttribute("srcset",o),i&&b(i))n.setAttribute("src",i);else if(!n.hasAttribute("src")||!b(n.getAttribute("src")||"")){const t=A(n.getAttribute("srcset")||o||"");t&&b(t)&&n.setAttribute("src",t)}return r.forEach((t=>t.remove())),t}},{selector:"uni-image-full-width",element:"figure",transform:(t,e)=>{var r;const n=e.createElement("figure"),o=e.createElement("img"),i=t.querySelector("img");if(!i)return console.warn("uni-image-full-width without img:",t.outerHTML),n;let a=i.getAttribute("src");const s=i.getAttribute("data-loading");if(s)try{const t=JSON.parse(s);t.desktop&&b(t.desktop)&&(a=t.desktop)}catch(t){console.warn("Failed to parse data-loading attribute:",s,t)}if(!a||!b(a))return console.warn("Could not find valid src for uni-image-full-width:",t.outerHTML),n;o.setAttribute("src",a);let l=i.getAttribute("alt");l||(l=t.getAttribute("alt-text")),l&&o.setAttribute("alt",l),n.appendChild(o);const c=t.querySelector("figcaption");if(c){const t=null===(r=c.textContent)||void 0===r?void 0:r.trim();if(t&&t.length>5){const r=e.createElement("figcaption"),o=c.querySelector(".rich-text p");o?r.innerHTML=o.innerHTML:r.textContent=t,n.appendChild(r)}}return n}},{selector:'img[data-src], img[data-srcset], img[loading="lazy"], img.lazy, img.lazyload',element:"img",transform:(t,e)=>{const r=t.getAttribute("src")||"",n=function(t){if(t.hasAttribute("data-src")||t.hasAttribute("data-srcset"))return!0;for(let e=0;e<t.attributes.length;e++){const r=t.attributes[e];if("src"!==r.name){if(r.name.startsWith("data-")&&/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(r.value))return!0;if(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(r.value))return!0}}return!1}(t);f(r)&&n&&t.removeAttribute("src");const o=t.getAttribute("data-src");o&&!t.getAttribute("src")&&t.setAttribute("src",o);const s=t.getAttribute("data-srcset");s&&!t.getAttribute("srcset")&&t.setAttribute("srcset",s);for(let e=0;e<t.attributes.length;e++){const r=t.attributes[e];"src"!==r.name&&"srcset"!==r.name&&"alt"!==r.name&&(i.test(r.value)?t.setAttribute("srcset",r.value):a.test(r.value)&&t.setAttribute("src",r.value))}return t.classList.remove("lazy","lazyload"),t.removeAttribute("data-ll-status"),t.removeAttribute("data-src"),t.removeAttribute("data-srcset"),t.removeAttribute("loading"),t}},{selector:"span:has(img)",element:"span",transform:(t,e)=>{try{if(!y(t))return t;const r=C(t);if(!r)return t;const n=w(t),o=S(r,e);if(n&&x(n)){const t=h(o,n,e);return n.parentNode&&n.parentNode.removeChild(n),t}return o}catch(e){return console.warn("Error processing span with image:",e),t}}},{selector:'figure, p:has([class*="caption"])',element:"figure",transform:(t,e)=>{try{if(!y(t))return t;const r=C(t);if(!r)return t;const n=w(t);if(n&&x(n)){const o=C(t);let i;return o?i=o:(console.warn("Figure rule couldn't find current image element in:",t.outerHTML),i=S(r,e)),h(i,n,e)}return t}catch(e){return console.warn("Error processing complex image element:",e),t}}}]},732:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.GeminiExtractor=void 0;const n=r(181);class o extends n.ConversationExtractor{constructor(t,e){super(t,e),this.messageCount=null,this.conversationContainers=t.querySelectorAll("div.conversation-container"),this.footnotes=[]}canExtract(){return!!this.conversationContainers&&this.conversationContainers.length>0}extractMessages(){this.messageCount=0;const t=[];return this.conversationContainers?(this.extractSources(),this.conversationContainers.forEach((e=>{const r=e.querySelector("user-query");if(r){const e=r.querySelector(".query-text");if(e){const r=e.innerHTML||"";t.push({author:"You",content:r.trim(),metadata:{role:"user"}})}}const n=e.querySelector("model-response");if(n){const e=n.querySelector(".model-response-text .markdown"),r=n.querySelector("#extended-response-markdown-content")||e;if(r){let e=r.innerHTML||"";const n=document.createElement("div");n.innerHTML=e,n.querySelectorAll(".table-content").forEach((t=>{t.classList.remove("table-content")})),e=n.innerHTML,t.push({author:"Gemini",content:e.trim(),metadata:{role:"assistant"}})}}})),this.messageCount=t.length,t):t}extractSources(){const t=this.document.querySelectorAll("browse-item");t&&t.length>0&&t.forEach((t=>{var e,r,n,o;const i=t.querySelector("a");if(i instanceof HTMLAnchorElement){const t=i.href,a=(null===(r=null===(e=i.querySelector(".domain"))||void 0===e?void 0:e.textContent)||void 0===r?void 0:r.trim())||"",s=(null===(o=null===(n=i.querySelector(".title"))||void 0===n?void 0:n.textContent)||void 0===o?void 0:o.trim())||"";t&&(a||s)&&this.footnotes.push({url:t,text:s?`${a}: ${s}`:a})}}))}getFootnotes(){return this.footnotes}getMetadata(){var t;const e=this.getTitle(),r=null!==(t=this.messageCount)&&void 0!==t?t:this.extractMessages().length;return{title:e,site:"Gemini",url:this.url,messageCount:r,description:`Gemini conversation with ${r} messages`}}getTitle(){var t,e,r,n,o;const i=null===(t=this.document.title)||void 0===t?void 0:t.trim();if(i&&"Gemini"!==i&&!i.includes("Gemini"))return i;const a=null===(r=null===(e=this.document.querySelector(".title-text"))||void 0===e?void 0:e.textContent)||void 0===r?void 0:r.trim();if(a)return a;const s=null===(o=null===(n=this.conversationContainers)||void 0===n?void 0:n.item(0))||void 0===o?void 0:o.querySelector(".query-text");if(s){const t=s.textContent||"";return t.length>50?t.slice(0,50)+"...":t}return"Gemini Conversation"}}e.GeminiExtractor=o},754:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.codeBlockRules=void 0;const n=r(552),o=[/^language-(\w+)$/,/^lang-(\w+)$/,/^(\w+)-code$/,/^code-(\w+)$/,/^syntax-(\w+)$/,/^code-snippet__(\w+)$/,/^highlight-(\w+)$/,/^(\w+)-snippet$/,/(?:^|\s)(?:language|lang|brush|syntax)-(\w+)(?:\s|$)/i],i=new Set(["abap","actionscript","ada","adoc","agda","antlr4","applescript","arduino","armasm","asciidoc","aspnet","atom","bash","batch","c","clojure","cmake","cobol","coffeescript","cpp","c++","crystal","csharp","cs","dart","django","dockerfile","dotnet","elixir","elm","erlang","fortran","fsharp","gdscript","gitignore","glsl","golang","gradle","graphql","groovy","haskell","hs","haxe","hlsl","html","idris","java","javascript","js","jsx","jsdoc","json","jsonp","julia","kotlin","latex","lisp","elisp","livescript","lua","makefile","markdown","md","markup","masm","mathml","matlab","mongodb","mysql","nasm","nginx","nim","nix","objc","ocaml","pascal","perl","php","postgresql","powershell","prolog","puppet","python","regex","rss","ruby","rb","rust","scala","scheme","shell","sh","solidity","sparql","sql","ssml","svg","swift","tcl","terraform","tex","toml","typescript","ts","tsx","unrealscript","verilog","vhdl","webassembly","wasm","xml","yaml","yml","zig"]);e.codeBlockRules=[{selector:["pre",'div[class*="prismjs"]',".syntaxhighlighter",".highlight",".highlight-source",".wp-block-syntaxhighlighter-code",".wp-block-code",'div[class*="language-"]'].join(", "),element:"pre",transform:(t,e)=>{if(!(t=>"classList"in t&&"getAttribute"in t&&"querySelector"in t)(t))return t;const r=t=>{var e;const r=t.getAttribute("data-lang")||t.getAttribute("data-language");if(r)return r.toLowerCase();const n=Array.from(t.classList||[]);if(null===(e=t.classList)||void 0===e?void 0:e.contains("syntaxhighlighter")){const t=n.find((t=>!["syntaxhighlighter","nogutter"].includes(t)));if(t&&i.has(t.toLowerCase()))return t.toLowerCase()}for(const t of n)for(const e of o){const r=t.toLowerCase().match(e);if(r&&r[1]&&i.has(r[1].toLowerCase()))return r[1].toLowerCase()}for(const t of n)if(i.has(t.toLowerCase()))return t.toLowerCase();return""};let a="",s=t;for(;s&&!a;){a=r(s);const t=s.querySelector("code");!a&&t&&(a=r(t)),s=s.parentElement}const l=t=>{if((0,n.isTextNode)(t))return t.textContent||"";let e="";if((0,n.isElement)(t)){if("BR"===t.tagName)return"\n";if(t.matches('div[class*="line"], span[class*="line"], .ec-line, [data-line-number], [data-line]')){const e=t.querySelector('.code, .content, [class*="code-"], [class*="content-"]');if(e)return(e.textContent||"")+"\n";const r=t.querySelector('.line-number, .gutter, [class*="line-number"], [class*="gutter"]');if(r){return Array.from(t.childNodes).filter((t=>!r.contains(t))).map((t=>l(t))).join("")+"\n"}return t.textContent+"\n"}t.childNodes.forEach((t=>{e+=l(t)}))}return e};let c="";t.matches(".syntaxhighlighter, .wp-block-syntaxhighlighter-code")&&(c=(t=>{const e=t.querySelector(".syntaxhighlighter table .code .container");if(e)return Array.from(e.children).map((t=>{const e=Array.from(t.querySelectorAll("code")).map((t=>{var e;let r=t.textContent||"";return(null===(e=t.classList)||void 0===e?void 0:e.contains("spaces"))&&(r=" ".repeat(r.length)),r})).join("");return e||t.textContent||""})).join("\n");const r=t.querySelectorAll(".code .line");return r.length>0?Array.from(r).map((t=>{const e=Array.from(t.querySelectorAll("code")).map((t=>t.textContent||"")).join("");return e||t.textContent||""})).join("\n"):""})(t)),c||(c=l(t)),c=c.replace(/^\s+|\s+$/g,"").replace(/\t/g,"    ").replace(/\n{3,}/g,"\n\n").replace(/\u00a0/g," ").replace(/^\n+/,"").replace(/\n+$/,"");const u=e.createElement("pre"),d=e.createElement("code");return a&&(d.setAttribute("data-lang",a),d.setAttribute("class",`language-${a}`)),d.textContent=c,u.appendChild(d),u}}]},840:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.standardizeContent=function(t,e,r,o=!1){(function(t){const e=t=>{if((0,c.isElement)(t)){const e=t.tagName.toLowerCase();if("pre"===e||"code"===e)return}if((0,c.isTextNode)(t)){const e=t.textContent||"",r=e.replace(/\xA0+/g,(e=>{var r,n,o,i;if(1===e.length){const e=null===(n=null===(r=t.previousSibling)||void 0===r?void 0:r.textContent)||void 0===n?void 0:n.slice(-1),a=null===(i=null===(o=t.nextSibling)||void 0===o?void 0:o.textContent)||void 0===i?void 0:i.charAt(0);if((null==e?void 0:e.match(/\w/))&&(null==a?void 0:a.match(/\w/)))return"\xa0"}return" ".repeat(e.length)}));r!==e&&(t.textContent=r)}t.hasChildNodes()&&Array.from(t.childNodes).forEach(e)};e(t)})(t),function(t){let e=0;Array.from(t.getElementsByTagName("*")).forEach((t=>{Array.from(t.childNodes).forEach((t=>{(0,c.isCommentNode)(t)&&(t.remove(),e++)}))})),(0,c.logDebug)("Removed HTML comments:",e)}(t),function(t,e,r){const o=t=>t.replace(/\u00A0/g," ").replace(/\s+/g," ").trim().toLowerCase(),i=t.getElementsByTagName("h1");Array.from(i).forEach((t=>{var e;const o=r.createElement("h2");o.innerHTML=t.innerHTML,Array.from(t.attributes).forEach((t=>{n.ALLOWED_ATTRIBUTES.has(t.name)&&o.setAttribute(t.name,t.value)})),null===(e=t.parentNode)||void 0===e||e.replaceChild(o,t)}));const a=t.getElementsByTagName("h2");if(a.length>0){const t=a[0],r=o(t.textContent||""),n=o(e);n&&n===r&&t.remove()}}(t,e.title,r),(0,a.standardizeFootnotes)(t),function(t,e){let r=0;u.forEach((n=>{t.querySelectorAll(n.selector).forEach((t=>{if(n.transform){const o=n.transform(t,e);t.replaceWith(o),r++}}))}));t.querySelectorAll("lite-youtube").forEach((t=>{const n=t.getAttribute("videoid");if(!n)return;const o=e.createElement("iframe");o.width="560",o.height="315",o.src=`https://www.youtube.com/embed/${n}`,o.title=t.getAttribute("videotitle")||"YouTube video player",o.frameBorder="0",o.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",o.setAttribute("allowfullscreen",""),t.replaceWith(o),r++})),(0,c.logDebug)("Converted embedded elements:",r)}(t,r),o?(m(t,o),d(t),h(t),(0,c.logDebug)("Debug mode: Skipping div flattening to preserve structure")):(p(t,r),m(t,o),function(t){let e=0,r=0,o=!0;for(;o;){r++,o=!1;const i=Array.from(t.getElementsByTagName("*")).filter((t=>{if(n.ALLOWED_EMPTY_ELEMENTS.has(t.tagName.toLowerCase()))return!1;const e=t.textContent||"",r=0===e.trim().length,o=e.includes("\xa0"),i=!t.hasChildNodes()||Array.from(t.childNodes).every((t=>{if((0,c.isTextNode)(t)){const e=t.textContent||"";return 0===e.trim().length&&!e.includes("\xa0")}return!1}));if("div"===t.tagName.toLowerCase()){const e=Array.from(t.children);if(e.length>0&&e.every((t=>{var e;if("span"!==t.tagName.toLowerCase())return!1;const r=(null===(e=t.textContent)||void 0===e?void 0:e.trim())||"";return","===r||""===r||" "===r})))return!0}return r&&!o&&i}));i.length>0&&(i.forEach((t=>{t.remove(),e++})),o=!0)}(0,c.logDebug)("Removed empty elements:",e,"iterations:",r)}(t),d(t),p(t,r),h(t),function(t,e){let r=0;const n=Date.now(),o=t=>{var e;if((0,c.isElement)(t)){const e=t.tagName.toLowerCase();if("pre"===e||"code"===e)return}if(Array.from(t.childNodes).forEach(o),(0,c.isTextNode)(t)){const n=t.textContent||"";if(!n||n.match(/^[\u200C\u200B\u200D\u200E\u200F\uFEFF\xA0\s]*$/))null===(e=t.parentNode)||void 0===e||e.removeChild(t),r++;else{const e=n.replace(/\n{3,}/g,"\n\n").replace(/^[\n\r\t]+/,"").replace(/[\n\r\t]+$/,"").replace(/[ \t]*\n[ \t]*/g,"\n").replace(/[ \t]{3,}/g," ").replace(/^[ ]+$/," ").replace(/\s+([,.!?:;])/g,"$1").replace(/[\u200C\u200B\u200D\u200E\u200F\uFEFF]+/g,"").replace(/(?:\xA0){2,}/g,"\xa0");e!==n&&(t.textContent=e,r+=n.length-e.length)}}},i=t=>{var n;if(!(0,c.isElement)(t))return;const o=t.tagName.toLowerCase();if("pre"===o||"code"===o)return;Array.from(t.childNodes).filter(c.isElement).forEach(i),t.normalize();const a="block"===(null===(n=(0,c.getComputedStyle)(t))||void 0===n?void 0:n.display),s=a?/^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/:/^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/,l=a?/^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/:/^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/;for(;t.firstChild&&(0,c.isTextNode)(t.firstChild)&&(t.firstChild.textContent||"").match(s);)t.removeChild(t.firstChild),r++;for(;t.lastChild&&(0,c.isTextNode)(t.lastChild)&&(t.lastChild.textContent||"").match(l);)t.removeChild(t.lastChild),r++;if(!a){const r=Array.from(t.childNodes);for(let n=0;n<r.length-1;n++){const o=r[n],i=r[n+1];if((0,c.isElement)(o)||(0,c.isElement)(i)){const r=i.textContent||"",n=o.textContent||"",a=r.match(/^[,.!?:;)\]]/),s=n.match(/[,.!?:;(\[]\s*$/),l=(0,c.isTextNode)(o)&&(o.textContent||"").endsWith(" ")||(0,c.isTextNode)(i)&&(i.textContent||"").startsWith(" ");if(!a&&!s&&!l){const r=e.createTextNode(" ");t.insertBefore(r,i)}}}}};o(t),i(t);const a=Date.now();(0,c.logDebug)("Removed empty lines:",{charactersRemoved:r,processingTime:`${(a-n).toFixed(2)}ms`})}(t,r))};const n=r(640),o=r(0),i=r(754),a=r(610),s=r(864),l=r(649),c=r(552),u=[...o.mathRules,...i.codeBlockRules,...s.headingRules,...l.imageRules,{selector:'div[data-testid^="paragraph"], div[role="paragraph"]',element:"p",transform:(t,e)=>{const r=e.createElement("p");return r.innerHTML=t.innerHTML,Array.from(t.attributes).forEach((t=>{n.ALLOWED_ATTRIBUTES.has(t.name)&&r.setAttribute(t.name,t.value)})),r}},{selector:'div[role="list"]',element:"ul",transform:(t,e)=>{var r;const n=t.querySelector('div[role="listitem"] .label'),o=((null===(r=null==n?void 0:n.textContent)||void 0===r?void 0:r.trim())||"").match(/^\d+\)/),i=e.createElement(o?"ol":"ul");return t.querySelectorAll('div[role="listitem"]').forEach((t=>{const r=e.createElement("li"),n=t.querySelector(".content");if(n){n.querySelectorAll('div[role="paragraph"]').forEach((t=>{const r=e.createElement("p");r.innerHTML=t.innerHTML,t.replaceWith(r)}));n.querySelectorAll('div[role="list"]').forEach((t=>{var r;const n=t.querySelector('div[role="listitem"] .label'),o=((null===(r=null==n?void 0:n.textContent)||void 0===r?void 0:r.trim())||"").match(/^\d+\)/),i=e.createElement(o?"ol":"ul");t.querySelectorAll('div[role="listitem"]').forEach((t=>{const r=e.createElement("li"),n=t.querySelector(".content");if(n){n.querySelectorAll('div[role="paragraph"]').forEach((t=>{const r=e.createElement("p");r.innerHTML=t.innerHTML,t.replaceWith(r)})),r.innerHTML=n.innerHTML}i.appendChild(r)})),t.replaceWith(i)})),r.innerHTML=n.innerHTML}i.appendChild(r)})),i}},{selector:'div[role="listitem"]',element:"li",transform:(t,e)=>{const r=t.querySelector(".content");if(!r)return t;return r.querySelectorAll('div[role="paragraph"]').forEach((t=>{const r=e.createElement("p");r.innerHTML=t.innerHTML,t.replaceWith(r)})),r}}];function d(t){let e=0;const r=e=>{let n="",o=e.nextSibling;for(;o;)((0,c.isTextNode)(o)||(0,c.isElement)(o))&&(n+=o.textContent||""),o=o.nextSibling;if(n.trim())return!0;const i=e.parentElement;return!(!i||i===t)&&r(i)};Array.from(t.querySelectorAll("h1, h2, h3, h4, h5, h6")).reverse().forEach((t=>{r(t)||(t.remove(),e++)})),e>0&&(0,c.logDebug)("Removed trailing headings:",e)}function m(t,e){let r=0;const o=t=>{if("svg"===t.tagName.toLowerCase()||"http://www.w3.org/2000/svg"===t.namespaceURI)return;const o=Array.from(t.attributes),i=t.tagName.toLowerCase();o.forEach((o=>{const a=o.name.toLowerCase(),s=o.value;"id"===a&&(s.startsWith("fnref:")||s.startsWith("fn:")||"footnotes"===s)||"class"===a&&("code"===i&&s.startsWith("language-")||"footnote-backref"===s)||(e?n.ALLOWED_ATTRIBUTES.has(a)||n.ALLOWED_ATTRIBUTES_DEBUG.has(a)||a.startsWith("data-")||(t.removeAttribute(o.name),r++):n.ALLOWED_ATTRIBUTES.has(a)||(t.removeAttribute(o.name),r++))}))};o(t),t.querySelectorAll("*").forEach(o),(0,c.logDebug)("Stripped attributes:",r)}function h(t){let e=0;const r=Date.now(),n=Array.from(t.getElementsByTagName("br"));let o=[];const i=()=>{if(o.length>2)for(let t=2;t<o.length;t++)o[t].remove(),e++;o=[]};n.forEach((t=>{var e;let r=!1;if(o.length>0){const n=o[o.length-1];let i=t.previousSibling;for(;i&&(0,c.isTextNode)(i)&&!(null===(e=i.textContent)||void 0===e?void 0:e.trim());)i=i.previousSibling;i===n&&(r=!0)}r?o.push(t):(i(),o=[t])})),i();const a=Date.now();(0,c.logDebug)("Standardized br elements:",{removed:e,processingTime:`${(a-r).toFixed(2)}ms`})}function p(t,e){let r=0;const o=Date.now();let i=!0;function a(t){var e;for(const r of t.childNodes){if((0,c.isTextNode)(r)&&(null===(e=r.textContent)||void 0===e?void 0:e.trim()))return!0;if((0,c.isElement)(r)&&n.INLINE_ELEMENTS.has(r.nodeName.toLowerCase()))return!0}return!1}const s=t=>{const e=t.tagName.toLowerCase();if(n.PRESERVE_ELEMENTS.has(e))return!0;const r=t.getAttribute("role");if(r&&["article","main","navigation","banner","contentinfo"].includes(r))return!0;const o=t.className;if("string"==typeof o&&o.toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/))return!0;return!!Array.from(t.children).some((t=>n.PRESERVE_ELEMENTS.has(t.tagName.toLowerCase())||"article"===t.getAttribute("role")||t.className&&"string"==typeof t.className&&t.className.toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/)))},l=t=>{var e;if(a(t))return!1;if(!(null===(e=t.textContent)||void 0===e?void 0:e.trim()))return!0;const r=Array.from(t.children);if(0===r.length)return!0;if(r.every((t=>{const e=t.tagName.toLowerCase();return n.BLOCK_ELEMENTS.includes(e)||"p"===e||"h1"===e||"h2"===e||"h3"===e||"h4"===e||"h5"===e||"h6"===e||"ul"===e||"ol"===e||"pre"===e||"blockquote"===e||"figure"===e})))return!0;const o=t.className.toLowerCase();if(/(?:wrapper|container|layout|row|col|grid|flex|outer|inner|content-area)/i.test(o))return!0;const i=Array.from(t.childNodes).filter((t=>{var e;return(0,c.isTextNode)(t)&&(null===(e=t.textContent)||void 0===e?void 0:e.trim())}));if(0===i.length)return!0;return!(!(r.length>0)||r.some((t=>{const e=t.tagName.toLowerCase();return n.INLINE_ELEMENTS.has(e)})))},u=o=>{var i,u;if(!o.isConnected||s(o))return!1;const d=o.tagName.toLowerCase();if(!n.ALLOWED_EMPTY_ELEMENTS.has(d)&&!o.children.length&&!(null===(i=o.textContent)||void 0===i?void 0:i.trim()))return o.remove(),r++,!0;if(o.parentElement===t){const t=Array.from(o.children);if(t.length>0&&!t.some((t=>{const e=t.tagName.toLowerCase();return n.INLINE_ELEMENTS.has(e)}))){const t=e.createDocumentFragment();for(;o.firstChild;)t.appendChild(o.firstChild);return o.replaceWith(t),r++,!0}}if(l(o)){if(!Array.from(o.children).some((t=>{const e=t.tagName.toLowerCase();return n.INLINE_ELEMENTS.has(e)}))){const t=e.createDocumentFragment();for(;o.firstChild;)t.appendChild(o.firstChild);return o.replaceWith(t),r++,!0}const t=e.createDocumentFragment();for(;o.firstChild;)t.appendChild(o.firstChild);return o.replaceWith(t),r++,!0}const m=Array.from(o.childNodes);if(m.length>0&&m.every((t=>(0,c.isTextNode)(t)||(0,c.isElement)(t)&&n.INLINE_ELEMENTS.has(t.nodeName.toLowerCase())))&&(null===(u=o.textContent)||void 0===u?void 0:u.trim())){const t=e.createElement("p");for(;o.firstChild;)t.appendChild(o.firstChild);return o.replaceWith(t),r++,!0}if(1===o.children.length){const t=o.firstElementChild,e=t.tagName.toLowerCase();if(n.BLOCK_ELEMENTS.includes(e)&&!s(t))return o.replaceWith(t),r++,!0}let h=0,p=o.parentElement;for(;p;){const t=p.tagName.toLowerCase();n.BLOCK_ELEMENTS.includes(t)&&h++,p=p.parentElement}if(h>0&&!a(o)){const t=e.createDocumentFragment();for(;o.firstChild;)t.appendChild(o.firstChild);return o.replaceWith(t),r++,!0}return!1},d=()=>{const e=Array.from(t.children).filter((t=>n.BLOCK_ELEMENTS.includes(t.tagName.toLowerCase())));let r=!1;return e.forEach((t=>{u(t)&&(r=!0)})),r},m=()=>{const e=Array.from(t.querySelectorAll(n.BLOCK_ELEMENTS.join(","))).sort(((t,e)=>{const r=t=>{let e=0,r=t.parentElement;for(;r;){const t=r.tagName.toLowerCase();n.BLOCK_ELEMENTS.includes(t)&&e++,r=r.parentElement}return e};return r(e)-r(t)}));let r=!1;return e.forEach((t=>{u(t)&&(r=!0)})),r},h=()=>{const o=Array.from(t.querySelectorAll(n.BLOCK_ELEMENTS.join(",")));let i=!1;return o.forEach((t=>{const n=Array.from(t.children);if(n.length>0&&n.every((t=>"p"===t.tagName.toLowerCase()))||!s(t)&&l(t)){const n=e.createDocumentFragment();for(;t.firstChild;)n.appendChild(t.firstChild);t.replaceWith(n),r++,i=!0}})),i};do{i=!1,d()&&(i=!0),m()&&(i=!0),h()&&(i=!0)}while(i);const p=Date.now();(0,c.logDebug)("Flattened wrapper elements:",{count:r,processingTime:`${(p-o).toFixed(2)}ms`})}},864:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.headingRules=void 0;const n=r(640);e.headingRules=[{selector:"h1, h2, h3, h4, h5, h6",element:"keep",transform:t=>{var e;const r=t.ownerDocument;if(!r)return console.warn("No document available"),t;const o=r.createElement(t.tagName);Array.from(t.attributes).forEach((t=>{n.ALLOWED_ATTRIBUTES.has(t.name)&&o.setAttribute(t.name,t.value)}));const i=t.cloneNode(!0),a=new Map;Array.from(i.querySelectorAll("*")).forEach((t=>{var e,r,n,o,s,l;let c=!1;if("a"===t.tagName.toLowerCase()){const r=t.getAttribute("href");((null==r?void 0:r.includes("#"))||(null==r?void 0:r.startsWith("#")))&&(a.set(t,(null===(e=t.textContent)||void 0===e?void 0:e.trim())||""),c=!0)}if(t.classList.contains("anchor")&&(a.set(t,(null===(r=t.textContent)||void 0===r?void 0:r.trim())||""),c=!0),"button"===t.tagName.toLowerCase()&&(c=!0),("span"===t.tagName.toLowerCase()||"div"===t.tagName.toLowerCase())&&t.querySelector('a[href^="#"]')){const e=t.querySelector('a[href^="#"]');e&&a.set(t,(null===(n=e.textContent)||void 0===n?void 0:n.trim())||""),c=!0}if(c){const e=t.parentElement;e&&e!==i&&(null===(o=e.textContent)||void 0===o?void 0:o.trim())===(null===(s=t.textContent)||void 0===s?void 0:s.trim())&&a.set(e,(null===(l=t.textContent)||void 0===l?void 0:l.trim())||"")}}));Array.from(i.querySelectorAll("*")).filter((t=>{if("a"===t.tagName.toLowerCase()){const e=t.getAttribute("href");return(null==e?void 0:e.includes("#"))||(null==e?void 0:e.startsWith("#"))}return!!t.classList.contains("anchor")||("button"===t.tagName.toLowerCase()||!("span"!==t.tagName.toLowerCase()&&"div"!==t.tagName.toLowerCase()||!t.querySelector('a[href^="#"]')))})).forEach((t=>t.remove()));let s=(null===(e=i.textContent)||void 0===e?void 0:e.trim())||"";return!s&&a.size>0&&(s=Array.from(a.values())[0]),o.textContent=s,o}}]},917:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.ExtractorRegistry=void 0;const n=r(959),o=r(248),i=r(258),a=r(458),s=r(632),l=r(397),c=r(20),u=r(732);class d{static initialize(){this.register({patterns:["twitter.com",/\/x\.com\/.*/],extractor:o.TwitterExtractor}),this.register({patterns:["reddit.com","old.reddit.com","new.reddit.com",/^https:\/\/[^\/]+\.reddit\.com/],extractor:n.RedditExtractor}),this.register({patterns:["youtube.com","youtu.be",/youtube\.com\/watch\?v=.*/,/youtu\.be\/.*/],extractor:i.YoutubeExtractor}),this.register({patterns:[/news\.ycombinator\.com\/item\?id=.*/],extractor:a.HackerNewsExtractor}),this.register({patterns:[/^https?:\/\/chatgpt\.com\/(c|share)\/.*/],extractor:s.ChatGPTExtractor}),this.register({patterns:[/^https?:\/\/claude\.ai\/(chat|share)\/.*/],extractor:l.ClaudeExtractor}),this.register({patterns:[/^https?:\/\/grok\.com\/(chat|share)(\/.*)?$/],extractor:c.GrokExtractor}),this.register({patterns:[/^https?:\/\/gemini\.google\.com\/app\/.*/],extractor:u.GeminiExtractor})}static register(t){this.mappings.push(t)}static findExtractor(t,e,r){try{const n=new URL(e).hostname;if(this.domainCache.has(n)){const o=this.domainCache.get(n);return o?new o(t,e,r):null}for(const{patterns:o,extractor:i}of this.mappings){if(o.some((t=>t instanceof RegExp?t.test(e):n.includes(t))))return this.domainCache.set(n,i),new i(t,e,r)}return this.domainCache.set(n,null),null}catch(t){return console.error("Error in findExtractor:",t),null}}static clearCache(){this.domainCache.clear()}}e.ExtractorRegistry=d,d.mappings=[],d.domainCache=new Map,d.initialize()},959:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.RedditExtractor=void 0;const n=r(279);class o extends n.BaseExtractor{constructor(t,e){super(t,e),this.shredditPost=t.querySelector("shreddit-post")}canExtract(){return!!this.shredditPost}extract(){var t,e;const r=this.getPostContent(),n=this.extractComments(),o=this.createContentHtml(r,n),i=(null===(e=null===(t=this.document.querySelector("h1"))||void 0===t?void 0:t.textContent)||void 0===e?void 0:e.trim())||"",a=this.getSubreddit(),s=this.getPostAuthor(),l=this.createDescription(r);return{content:o,contentHtml:o,extractedContent:{postId:this.getPostId(),subreddit:a,postAuthor:s},variables:{title:i,author:s,site:`r/${a}`,description:l}}}getPostContent(){var t,e,r,n;return((null===(e=null===(t=this.shredditPost)||void 0===t?void 0:t.querySelector('[slot="text-body"]'))||void 0===e?void 0:e.innerHTML)||"")+((null===(n=null===(r=this.shredditPost)||void 0===r?void 0:r.querySelector("#post-image"))||void 0===n?void 0:n.outerHTML)||"")}createContentHtml(t,e){return`\n\t\t\t<div class="reddit-post">\n\t\t\t\t<div class="post-content">\n\t\t\t\t\t${t}\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t${e?`\n\t\t\t\t<hr>\n\t\t\t\t<h2>Comments</h2>\n\t\t\t\t<div class="reddit-comments">\n\t\t\t\t\t${e}\n\t\t\t\t</div>\n\t\t\t`:""}\n\t\t`.trim()}extractComments(){const t=Array.from(this.document.querySelectorAll("shreddit-comment"));return this.processComments(t)}getPostId(){const t=this.url.match(/comments\/([a-zA-Z0-9]+)/);return(null==t?void 0:t[1])||""}getSubreddit(){const t=this.url.match(/\/r\/([^/]+)/);return(null==t?void 0:t[1])||""}getPostAuthor(){var t;return(null===(t=this.shredditPost)||void 0===t?void 0:t.getAttribute("author"))||""}createDescription(t){var e;if(!t)return"";const r=document.createElement("div");return r.innerHTML=t,(null===(e=r.textContent)||void 0===e?void 0:e.trim().slice(0,140).replace(/\s+/g," "))||""}processComments(t){var e;let r="",n=-1,o=[];for(const i of t){const t=parseInt(i.getAttribute("depth")||"0"),a=i.getAttribute("author")||"",s=i.getAttribute("score")||"0",l=i.getAttribute("permalink")||"",c=(null===(e=i.querySelector('[slot="comment"]'))||void 0===e?void 0:e.innerHTML)||"",u=i.querySelector("faceplate-timeago"),d=(null==u?void 0:u.getAttribute("ts"))||"",m=d?new Date(d).toISOString().split("T")[0]:"";if(0===t){for(;o.length>0;)r+="</blockquote>",o.pop();r+="<blockquote>",o=[0],n=0}else if(t<n)for(;o.length>0&&o[o.length-1]>=t;)r+="</blockquote>",o.pop();else t>n&&(r+="<blockquote>",o.push(t));r+=`<div class="comment">\n\t<div class="comment-metadata">\n\t\t<span class="comment-author"><strong>${a}</strong></span> \u2022\n\t\t<a href="https://reddit.com${l}" class="comment-link">${s} points</a> \u2022\n\t\t<span class="comment-date">${m}</span>\n\t</div>\n\t<div class="comment-content">${c}</div>\n</div>`,n=t}for(;o.length>0;)r+="</blockquote>",o.pop();return r}}e.RedditExtractor=o},968:(t,e,r)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.ContentScorer=void 0;const n=r(640),o=["admonition","article","content","entry","image","img","font","figure","figcaption","pre","main","post","story","table"],i=["advertisement","all rights reserved","banner","cookie","comments","copyright","follow me","follow us","footer","header","homepage","login","menu","more articles","more like this","most read","nav","navigation","newsletter","newsletter","popular","privacy","recommended","register","related","responses","share","sidebar","sign in","sign up","signup","social","sponsored","subscribe","subscribe","terms","trending"],a=["ad","banner","cookie","copyright","footer","header","homepage","menu","nav","newsletter","popular","privacy","recommended","related","rights","share","sidebar","social","sponsored","subscribe","terms","trending","widget"];class s{constructor(t,e=!1){this.doc=t,this.debug=e}static scoreElement(t){let e=0;const r=t.textContent||"",o=r.split(/\s+/).length;e+=o;e+=10*t.getElementsByTagName("p").length;e-=5*(t.getElementsByTagName("a").length/(o||1));e-=3*(t.getElementsByTagName("img").length/(o||1));try{const r=t.getAttribute("style")||"",n=t.getAttribute("align")||"";(r.includes("float: right")||r.includes("text-align: right")||"right"===n)&&(e+=5)}catch(t){}/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i.test(r)&&(e+=10);/\b(?:by|written by|author:)\s+[A-Za-z\s]+\b/i.test(r)&&(e+=10);const i=t.className.toLowerCase();(i.includes("content")||i.includes("article")||i.includes("post"))&&(e+=15);t.querySelector(n.FOOTNOTE_INLINE_REFERENCES)&&(e+=10);t.querySelector(n.FOOTNOTE_LIST_SELECTORS)&&(e+=10);if(e-=5*t.getElementsByTagName("table").length,"td"===t.tagName.toLowerCase()){const r=t.closest("table");if(r){const n=parseInt(r.getAttribute("width")||"0"),o=r.getAttribute("align")||"",i=r.className.toLowerCase();if(n>400||"center"===o||i.includes("content")||i.includes("article")){const n=Array.from(r.getElementsByTagName("td")),o=n.indexOf(t);o>0&&o<n.length-1&&(e+=10)}}}return e}static findBestElement(t,e=50){let r=null,n=0;return t.forEach((t=>{const e=this.scoreElement(t);e>n&&(n=e,r=t)})),n>e?r:null}static scoreAndRemove(t,e=!1){const r=Date.now();let o=0;const i=new Set;Array.from(t.querySelectorAll(n.BLOCK_ELEMENTS.join(","))).forEach((t=>{if(i.has(t))return;if(s.isLikelyContent(t))return;s.scoreNonContentBlock(t)<0&&(i.add(t),o++)})),i.forEach((t=>t.remove()));const a=Date.now();e&&console.log("Defuddle","Removed non-content blocks:",{count:o,processingTime:`${(a-r).toFixed(2)}ms`})}static isLikelyContent(t){const e=t.getAttribute("role");if(e&&["article","main","contentinfo"].includes(e))return!0;const r=t.className.toLowerCase(),n=t.id.toLowerCase();for(const t of o)if(r.includes(t)||n.includes(t))return!0;const i=(t.textContent||"").split(/\s+/).length,a=t.getElementsByTagName("p").length;return i>50&&a>1||(i>100||i>30&&a>0)}static scoreNonContentBlock(t){if(t.querySelector(n.FOOTNOTE_LIST_SELECTORS))return 0;let e=0;const r=t.textContent||"",o=r.split(/\s+/).length;if(o<3)return 0;for(const t of i)r.toLowerCase().includes(t)&&(e-=10);const s=t.getElementsByTagName("a").length;s/(o||1)>.5&&(e-=15);const l=t.getElementsByTagName("ul").length+t.getElementsByTagName("ol").length;l>0&&s>3*l&&(e-=10);const c=t.className.toLowerCase(),u=t.id.toLowerCase();for(const t of a)(c.includes(t)||u.includes(t))&&(e-=8);return e}}e.ContentScorer=s}},e={};function r(n){var o=e[n];if(void 0!==o)return o.exports;var i=e[n]={exports:{}};return t[n](i,i.exports,r),i.exports}var n={};return(()=>{var t=n;const e=r(628);t.default=e.Defuddle})(),n=n.default})()));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/* harmony import */ var defuddle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(609);


// Add debug information to verify Defuddle is loaded
console.log('Defuddle imported:', typeof defuddle__WEBPACK_IMPORTED_MODULE_0__);
console.log('Defuddle class:', defuddle__WEBPACK_IMPORTED_MODULE_0__);

// 生成预览用的简化slug
function generatePreviewSlug(title) {
  if (!title || typeof title !== 'string') return '';
  
  console.log('🔧 生成预览slug - 标题:', title);
  
  // 简化的中文转拼音映射
  const pinyinMap = {
    // 常用科技词汇
    '技': 'ji', '术': 'shu', '人': 'ren', '工': 'gong', '智': 'zhi', '能': 'neng',
    '数': 'shu', '据': 'ju', '分': 'fen', '析': 'xi', '系': 'xi', '统': 'tong',
    '开': 'kai', '发': 'fa', '程': 'cheng', '序': 'xu', '网': 'wang', '站': 'zhan',
    '应': 'ying', '用': 'yong', '软': 'ruan', '件': 'jian', '服': 'fu', '务': 'wu',
    '前': 'qian', '端': 'duan', '后': 'hou', '库': 'ku', '框': 'kuang', '架': 'jia',
    '算': 'suan', '法': 'fa', '机': 'ji', '器': 'qi', '学': 'xue', '习': 'xi',
    '深': 'shen', '度': 'du', '神': 'shen', '经': 'jing', '络': 'luo',
    '模': 'mo', '型': 'xing', '训': 'xun', '练': 'lian',
    
    // 常用字
    '大': 'da', '小': 'xiao', '新': 'xin', '老': 'lao', '好': 'hao', 
    '中': 'zhong', '国': 'guo', '的': 'de', '是': 'shi', '在': 'zai',
    '有': 'you', '和': 'he', '与': 'yu', '来': 'lai', '去': 'qu',
    '上': 'shang', '下': 'xia', '会': 'hui', '可': 'ke', '以': 'yi',
    '要': 'yao', '说': 'shuo', '看': 'kan', '做': 'zuo', '想': 'xiang',
    
    // 故障相关
    '故': 'gu', '障': 'zhang', '问': 'wen', '题': 'ti', '解': 'jie', '决': 'jue',
    '修': 'xiu', '复': 'fu', '错': 'cuo', '误': 'wu', '失': 'shi', '败': 'bai',
    
    // 云服务相关
    '云': 'yun', '服': 'fu', '务': 'wu', '阿': 'a', '里': 'li', '域': 'yu',
    '名': 'ming', '核': 'he', '心': 'xin', '被': 'bei', '拖': 'tuo', '走': 'zou'
  };
  
  const slug = title
    .trim()
    .substring(0, 50) // 限制长度
    .toLowerCase()
    // 转换中文字符为拼音
    .replace(/[\u4e00-\u9fa5]/g, char => pinyinMap[char] || 'ch')
    // 处理标点和特殊字符
    .replace(/[，。！？；：""''（）【】《》、]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30);
  
  // 添加短时间戳确保唯一性
  const timestamp = Date.now().toString().slice(-4);
  const finalSlug = slug ? `${slug}-${timestamp}` : `article-${timestamp}`;
  
  console.log('🔧 生成预览slug - 结果:', finalSlug);
  return finalSlug;
}

// 🛡️ 其他Extension清理器
function cleanupOtherExtensions() {
  let removedCount = 0;
  
  // 1. 移除其他Extension的图片元素
  const extensionImages = document.querySelectorAll('img[src*="chrome-extension://"], img[src*="moz-extension://"], img[src*="extension://"]');
  extensionImages.forEach(img => {
    console.log('🗑️ Removing other extension image:', img.src);
    img.remove();
    removedCount++;
  });
  
  // 2. 移除其他Extension注入的容器元素
  const extensionContainers = document.querySelectorAll('[class*="chrome-extension"], [id*="chrome-extension"], [class*="extension"], [id*="extension"]');
  extensionContainers.forEach(container => {
    // 避免移除我们自己的元素
    if (!container.closest('[data-enhanced-extractor]')) {
      console.log('🗑️ Removing other extension container:', container.tagName, container.className, container.id);
      container.remove();
      removedCount++;
    }
  });
  
  // 3. 移除其他Extension的Shadow DOM
  document.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      const shadowImages = el.shadowRoot.querySelectorAll('img[src*="chrome-extension://"], img[src*="moz-extension://"]');
      if (shadowImages.length > 0) {
        console.log('🗑️ Removing shadow DOM extension images:', shadowImages.length);
        shadowImages.forEach(img => img.remove());
        removedCount += shadowImages.length;
      }
    }
  });
  
  // 4. 移除具有extension URL背景的元素
  document.querySelectorAll('*').forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const backgroundImage = computedStyle.backgroundImage;
    if (backgroundImage && (backgroundImage.includes('chrome-extension://') || backgroundImage.includes('moz-extension://'))) {
      console.log('🗑️ Removing element with extension background:', backgroundImage);
      el.remove();
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`🛡️ Extension cleanup: removed ${removedCount} other extension elements`);
  }
  
  return removedCount;
}

// 定期清理其他Extension注入（因为有些Extension会动态注入）
function startExtensionCleanupWatcher() {
  // 等待DOM准备好
  const initializeWatcher = () => {
    // 确保document.body存在
    if (!document.body) {
      // 如果body还不存在，等待一下再试
      setTimeout(initializeWatcher, 50);
      return;
    }
    
    // 立即执行一次清理
    cleanupOtherExtensions();
    
    // 使用MutationObserver监控DOM变化
    const observer = new MutationObserver((mutations) => {
      let needsCleanup = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 检查新添加的节点是否包含extension内容
              const hasExtensionContent = 
                node.querySelector && (
                  node.querySelector('img[src*="chrome-extension://"]') ||
                  node.querySelector('img[src*="moz-extension://"]') ||
                  node.matches('[class*="extension"]') ||
                  node.matches('[id*="extension"]')
                );
              
              if (hasExtensionContent) {
                needsCleanup = true;
              }
            }
          });
        }
      });
      
      if (needsCleanup) {
        console.log('🔍 Detected extension content injection, cleaning up...');
        setTimeout(() => cleanupOtherExtensions(), 100); // 延迟一点执行清理
      }
    });
    
    // 开始观察
    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('🛡️ Extension cleanup watcher started');
    } catch (error) {
      console.error('🚨 Failed to start extension cleanup watcher:', error);
      // 作为备用方案，使用定时器清理
      setInterval(cleanupOtherExtensions, 2000);
      console.log('🛡️ Using fallback timer-based cleanup');
    }
  };
  
  // 如果DOM已经准备好，立即初始化；否则等待
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWatcher);
  } else {
    initializeWatcher();
  }
}

// 规则引擎 - DOM清理规则
const DEFAULT_CLEANUP_RULES = [
  // 微信特定的清理规则（只在微信域名生效）
  { type: 'id', value: 'content_bottom_area', description: '微信底部推荐区域', domains: ['mp.weixin.qq.com'] },
  { type: 'id', value: 'js_article_comment', description: '微信评论区域', domains: ['mp.weixin.qq.com'] },
  { type: 'id', value: 'js_tags', description: '微信标签区域', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'rich_media_tool', description: '微信工具栏', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'share_notice', description: '微信分享提示', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'qr_code_pc', description: '微信二维码', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'reward_area', description: '微信打赏区域', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'promotion_area', description: '推广区域', domains: ['mp.weixin.qq.com'] },
  
  // 知乎特定规则
  { type: 'class', value: 'RichContent-actions', description: '知乎操作栏', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
  { type: 'class', value: 'ContentItem-actions', description: '知乎内容操作', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
  { type: 'class', value: 'Recommendations-Main', description: '知乎推荐', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
  
  // 简书特定规则
  { type: 'class', value: 'follow-detail', description: '简书关注详情', domains: ['www.jianshu.com'] },
  { type: 'class', value: 'recommendation', description: '简书推荐', domains: ['www.jianshu.com'] },
  
  // CSDN特定规则
  { type: 'class', value: 'tool-box', description: 'CSDN工具箱', domains: ['blog.csdn.net'] },
  { type: 'class', value: 'recommend-box', description: 'CSDN推荐', domains: ['blog.csdn.net'] },
  
  // 通用广告和噪音清理（适用于所有网站）
  { type: 'class', value: 'advertisement', description: '广告区域' },
  { type: 'class', value: 'ads', description: '广告' },
  { type: 'class', value: 'banner', description: '横幅广告' },
  { type: 'class', value: 'sidebar', description: '侧边栏' },
  { type: 'class', value: 'footer', description: '页脚' },
  { type: 'class', value: 'navigation', description: '导航栏' },
  { type: 'class', value: 'nav', description: '导航' },
  { type: 'class', value: 'menu', description: '菜单' },
  { type: 'class', value: 'social-share', description: '社交分享' },
  { type: 'class', value: 'comments', description: '评论区' },
  { type: 'class', value: 'related-articles', description: '相关文章' },
  
  // 标签级别清理（适用于所有网站）
  { type: 'tag', value: 'script', description: '脚本标签' },
  { type: 'tag', value: 'style', description: '样式标签' },
  { type: 'tag', value: 'noscript', description: 'NoScript标签' }
];

// 检查域名是否匹配规则
function isDomainMatched(rule, currentHostname) {
  // 如果规则没有指定domains，则适用于所有域名
  if (!rule.domains || !Array.isArray(rule.domains) || rule.domains.length === 0) {
    return true;
  }
  
  // 检查当前hostname是否匹配任何指定域名
  return rule.domains.some(domain => {
    // 精确匹配
    if (currentHostname === domain) {
      return true;
    }
    // 支持通配符匹配（例如: *.zhihu.com）
    if (domain.startsWith('*.')) {
      const baseDomain = domain.substring(2);
      return currentHostname.endsWith('.' + baseDomain) || currentHostname === baseDomain;
    }
    return false;
  });
}

// 应用DOM清理规则
function applyCleanupRules(targetDocument, rules = DEFAULT_CLEANUP_RULES) {
  const currentHostname = window.location.hostname;
  console.log('🧹 Applying DOM cleanup rules:', rules.length, 'for domain:', currentHostname);
  
  let removedCount = 0;
  let appliedRules = 0;
  let skippedRules = 0;
  
  rules.forEach(rule => {
    try {
      // 检查域名匹配
      if (!isDomainMatched(rule, currentHostname)) {
        skippedRules++;
        console.log(`⏭️ Skipping rule for different domain: ${rule.description} (domains: ${rule.domains?.join(', ') || 'all'})`);
        return;
      }
      
      appliedRules++;
      let elements = [];
      
      switch (rule.type) {
        case 'id':
          const elementById = targetDocument.getElementById(rule.value);
          if (elementById) elements = [elementById];
          break;
          
        case 'class':
          elements = Array.from(targetDocument.getElementsByClassName(rule.value));
          break;
          
        case 'tag':
          elements = Array.from(targetDocument.getElementsByTagName(rule.value));
          break;
          
        case 'selector':
          elements = Array.from(targetDocument.querySelectorAll(rule.value));
          break;
          
        case 'regex-class':
          // 通过正则表达式匹配class名
          const allElements = targetDocument.querySelectorAll('[class]');
          const regex = new RegExp(rule.value, 'i');
          elements = Array.from(allElements).filter(el => 
            Array.from(el.classList).some(className => regex.test(className))
          );
          break;
      }
      
      if (elements.length > 0) {
        const domainInfo = rule.domains ? ` [${rule.domains.join(', ')}]` : ' [all domains]';
        console.log(`🗑️ Removing ${elements.length} elements for rule: ${rule.description} (${rule.type}: ${rule.value})${domainInfo}`);
        elements.forEach(element => {
          element.remove();
          removedCount++;
        });
      }
    } catch (error) {
      console.warn(`❌ Error applying cleanup rule ${rule.type}:${rule.value}:`, error);
    }
  });
  
  console.log(`✅ DOM cleanup completed for ${currentHostname}:`);
  console.log(`   📊 Applied rules: ${appliedRules}`);
  console.log(`   ⏭️ Skipped rules: ${skippedRules}`);
  console.log(`   🗑️ Removed elements: ${removedCount}`);
  return removedCount;
}

// Enhanced content extraction using Defuddle for superior content filtering
async function extractArticle() {
  try {
    // Check if we're on a WeChat article page
    const isWeChatArticle = window.location.hostname === 'mp.weixin.qq.com';
    
    console.log('Starting extraction. WeChat article:', isWeChatArticle);
    
    // Apply cleanup rules BEFORE extraction for better results
    console.log('🚀 Starting pre-processing with cleanup rules...');
    
    // Load custom cleanup rules from storage
    let cleanupRules = DEFAULT_CLEANUP_RULES;
    try {
      const storage = await chrome.storage.sync.get(['customCleanupRules', 'enableCleanupRules']);
      if (storage.enableCleanupRules !== false) { // enabled by default
        if (storage.customCleanupRules && Array.isArray(storage.customCleanupRules)) {
          // Merge custom rules with default rules
          cleanupRules = [...DEFAULT_CLEANUP_RULES, ...storage.customCleanupRules];
          console.log('📝 Loaded custom cleanup rules:', storage.customCleanupRules.length);
        }
      } else {
        console.log('⏸️ Cleanup rules disabled by user');
        cleanupRules = [];
      }
    } catch (error) {
      console.warn('⚠️ Could not load custom cleanup rules, using defaults:', error);
    }
    
    const removedElements = applyCleanupRules(document, cleanupRules);
    console.log(`🎯 Pre-processing complete. Removed ${removedElements} noise elements.`);
    
    if (isWeChatArticle) {
      // Use enhanced WeChat-specific extraction
      return extractWeChatArticle();
    } else {
      // Use Defuddle for general web content extraction
      return extractGeneralContent();
    }
  } catch (error) {
    console.error('Content extraction failed:', error);
    // Fallback to basic extraction
    return extractBasicContent();
  }
}

function extractWeChatArticle() {
  // Enhanced WeChat extraction that first tries Defuddle, then falls back to specific selectors
  console.log('Extracting WeChat article with Defuddle enhancement');
  
  try {
    // Try Defuddle first even for WeChat articles to get better content filtering
    console.log('Trying Defuddle for WeChat article...');
    const defuddle = new defuddle__WEBPACK_IMPORTED_MODULE_0__(document, {
      debug: true, // Enable debug for troubleshooting
      removeExactSelectors: false,  // 降低清理强度，避免误删正文
      removePartialSelectors: false // 降低清理强度
    });
    
    const result = defuddle.parse();
    console.log('WeChat Defuddle result:', result);
    
    // If Defuddle found good content, enhance it with WeChat-specific metadata
    if (result && result.content && result.content.length > 100) {
      console.log('Using Defuddle result for WeChat, content length:', result.content.length);
      return enhanceWithWeChatMetadata(result);
    } else {
      console.log('Defuddle result not good enough for WeChat, falling back');
    }
  } catch (error) {
    console.log('Defuddle extraction failed for WeChat, falling back to selectors:', error);
  }
  
  // Fallback to original WeChat selectors if Defuddle didn't work well
  console.log('Using WeChat selector fallback');
  const titleEl = document.querySelector('#activity-name') || 
                  document.querySelector('.rich_media_title') ||
                  document.querySelector('h1');
  
  const authorEl = document.querySelector('#js_name') ||
                   document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('.account_nickname_inner');
  
  const publishTimeEl = document.querySelector('#publish_time') ||
                        document.querySelector('.rich_media_meta_text');
  
  const contentEl = document.querySelector('#js_content') ||
                    document.querySelector('.rich_media_content');
  
  const digestEl = document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('meta[name="description"]');
  
  // Extract images
  const images = [];
  if (contentEl) {
    const imgElements = contentEl.querySelectorAll('img[data-src], img[src]');
    console.log(`🖼️ 从微信选择器方式找到 ${imgElements.length} 个图片元素`);
    
    imgElements.forEach((img, index) => {
      const src = img.getAttribute('data-src') || img.src;
      console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
      if (isValidImageUrl(src)) {
        console.log(`✅ 添加有效图片: ${src}`);
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      } else {
        console.log(`❌ 跳过无效图片: ${src}`);
      }
    });
  }

  const articleTitle = titleEl ? titleEl.innerText.trim() : '';
  const articleSlug = articleTitle ? generatePreviewSlug(articleTitle) : '';
  
  return {
    title: articleTitle,
    author: authorEl ? authorEl.innerText.trim() : '',
    publishTime: publishTimeEl ? publishTimeEl.innerText.trim() : '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: digestEl ? (digestEl.content || digestEl.innerText || '').trim() : '',
    images: images,
    url: window.location.href,
    slug: articleSlug,
    timestamp: Date.now(),
    extractionMethod: 'wechat-fallback'
  };
}

function enhanceWithWeChatMetadata(defuddleResult) {
  // Get WeChat-specific metadata and combine with Defuddle's cleaned content
  const authorEl = document.querySelector('#js_name') ||
                   document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('.account_nickname_inner');
  
  const publishTimeEl = document.querySelector('#publish_time') ||
                        document.querySelector('.rich_media_meta_text');
  
  const digestEl = document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('meta[name="description"]');

  // Extract images from the cleaned content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = defuddleResult.content;
  const imgElements = tempDiv.querySelectorAll('img');
  const images = [];
  const seenUrls = new Set(); // 用于去重
  
  console.log(`🖼️ 从Defuddle清理的内容中找到 ${imgElements.length} 个图片元素`);
  
  imgElements.forEach((img, index) => {
    const src = img.getAttribute('data-src') || img.src;
    console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
    
    if (isValidImageUrl(src)) {
      // 检查URL是否已经存在
      if (seenUrls.has(src)) {
        console.log(`🔄 跳过重复图片: ${src}`);
        return;
      }
      
      seenUrls.add(src);
      console.log(`✅ 添加有效图片: ${src}`);
      images.push({
        src: src,
        alt: img.alt || '',
        index: index
      });
    } else {
      console.log(`❌ 跳过无效图片: ${src}`);
    }
  });
  

  
  console.log(`📊 图片去重完成，最终收集到 ${images.length} 个唯一图片`);

  const articleTitle = defuddleResult.title || '';
  const articleSlug = articleTitle ? generatePreviewSlug(articleTitle) : '';
  
  return {
    title: articleTitle,
    author: defuddleResult.author || (authorEl ? authorEl.innerText.trim() : ''),
    publishTime: defuddleResult.published || (publishTimeEl ? publishTimeEl.innerText.trim() : ''),
    content: defuddleResult.content || '',
    digest: defuddleResult.description || (digestEl ? (digestEl.content || digestEl.innerText || '').trim() : ''),
    images: images,
    url: defuddleResult.url || window.location.href,
    slug: articleSlug,
    timestamp: Date.now(),
    extractionMethod: 'defuddle-enhanced-wechat',
    wordCount: defuddleResult.wordCount || 0,
    parseTime: defuddleResult.parseTime || 0,
    domain: defuddleResult.domain || '',
    site: defuddleResult.site || ''
  };
}

function extractGeneralContent() {
  // Use Defuddle for general web content extraction
  console.log('Extracting general content with Defuddle');
  console.log('Defuddle constructor available:', typeof defuddle__WEBPACK_IMPORTED_MODULE_0__);
  
  try {
    console.log('Creating Defuddle instance...');
    const defuddle = new defuddle__WEBPACK_IMPORTED_MODULE_0__(document, {
      debug: true, // Enable debug for troubleshooting
      removeExactSelectors: false,  // 降低清理强度，避免误删正文
      removePartialSelectors: false // 降低清理强度
    });
    
    console.log('Defuddle instance created, calling parse...');
    const result = defuddle.parse();
    console.log('Defuddle parse result:', result);
    console.log('Content length:', result?.content?.length || 0);
    
    if (!result || !result.content || result.content.length < 50) {
      console.log('Defuddle extraction yielded poor results, falling back');
      console.log('Result details:', {
        hasResult: !!result,
        hasContent: !!result?.content,
        contentLength: result?.content?.length || 0
      });
      return extractBasicContent();
    }
    
    console.log('Defuddle extraction successful, processing images...');
    
    // Extract images from the cleaned content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.content;
    const imgElements = tempDiv.querySelectorAll('img');
    const images = [];
    const seenUrls = new Set(); // 用于去重
    
    console.log(`🖼️ 从Defuddle通用内容中找到 ${imgElements.length} 个图片元素`);
    
    imgElements.forEach((img, index) => {
      const src = img.src;
      console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
      
      if (isValidImageUrl(src)) {
        // 检查URL是否已经存在
        if (seenUrls.has(src)) {
          console.log(`🔄 跳过重复图片: ${src}`);
          return;
        }
        
        seenUrls.add(src);
        console.log(`✅ 添加有效图片: ${src}`);
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      } else {
        console.log(`❌ 跳过无效图片: ${src}`);
      }
    });
    
    console.log(`📊 通用内容图片去重完成，最终收集到 ${images.length} 个唯一图片`);
    
    const articleTitle = result.title || document.title || '';
    const articleSlug = articleTitle ? generatePreviewSlug(articleTitle) : '';
    
    const finalResult = {
      title: articleTitle,
      author: result.author || '',
      publishTime: result.published || '',
      content: result.content || '',
      digest: result.description || '',
      images: images,
      url: result.url || window.location.href,
      slug: articleSlug,
      timestamp: Date.now(),
      extractionMethod: 'defuddle',
      wordCount: result.wordCount || 0,
      parseTime: result.parseTime || 0,
      domain: result.domain || '',
      site: result.site || ''
    };
    
    console.log('Final Defuddle result:', {
      method: finalResult.extractionMethod,
      titleLength: finalResult.title.length,
      contentLength: finalResult.content.length,
      imageCount: finalResult.images.length
    });
    
    return finalResult;
  } catch (error) {
    console.error('Defuddle extraction failed:', error);
    console.error('Error stack:', error.stack);
    return extractBasicContent();
  }
}

function extractBasicContent() {
  // Basic fallback extraction for when Defuddle is not available or fails
  console.log('Using basic content extraction fallback');
  
  // Try to find the main content area
  const contentSelectors = [
    'article',
    'main',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content',
    '.main-content',
    '[role="main"]'
  ];
  
  let contentEl = null;
  for (const selector of contentSelectors) {
    contentEl = document.querySelector(selector);
    if (contentEl && contentEl.innerText.length > 200) {
      console.log('Found content with selector:', selector);
      break;
    }
  }
  
  // If no good content area found, try to get the largest text block
  if (!contentEl) {
    console.log('No good content selector found, trying largest text block...');
    const allDivs = document.querySelectorAll('div, section, article');
    let maxLength = 0;
    for (const div of allDivs) {
      const textLength = div.innerText ? div.innerText.length : 0;
      if (textLength > maxLength && textLength > 200) {
        maxLength = textLength;
        contentEl = div;
      }
    }
    console.log('Largest text block length:', maxLength);
  }
  
  // Get images from the content area
  const images = [];
  const seenUrls = new Set(); // 用于去重
  
  if (contentEl) {
    const imgElements = contentEl.querySelectorAll('img');
    console.log(`🖼️ 从基础内容提取中找到 ${imgElements.length} 个图片元素`);
    
    imgElements.forEach((img, index) => {
      const src = img.src;
      console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
      
      if (isValidImageUrl(src)) {
        // 检查URL是否已经存在
        if (seenUrls.has(src)) {
          console.log(`🔄 跳过重复图片: ${src}`);
          return;
        }
        
        seenUrls.add(src);
        console.log(`✅ 添加有效图片: ${src}`);
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      } else {
        console.log(`❌ 跳过无效图片: ${src}`);
      }
    });
  }
  
  console.log(`📊 基础内容图片去重完成，最终收集到 ${images.length} 个唯一图片`);
  
  // Get title
  const title = document.querySelector('h1')?.innerText?.trim() || 
                document.title || 
                '';
  
  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                   document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                   '';
  
  const articleSlug = title ? generatePreviewSlug(title) : '';
  
  const basicResult = {
    title: title,
    author: '',
    publishTime: '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: metaDesc,
    images: images,
    url: window.location.href,
    slug: articleSlug,
    timestamp: Date.now(),
    extractionMethod: 'basic-fallback'
  };
  
  console.log('Basic extraction result:', {
    method: basicResult.extractionMethod,
    titleLength: basicResult.title.length,
    contentLength: basicResult.content.length,
    imageCount: basicResult.images.length
  });
  
  return basicResult;
}

// Enhanced metadata extraction inspired by Obsidian Clipper
function extractEnhancedMetadata(document) {
  console.log('🔍 Extracting enhanced metadata...');
  
  const metadata = {
    title: '',
    source: window.location.href,
    author: '',
    published: '',
    created: new Date().toISOString(),
    description: '',
    siteName: '',
    canonical: '',
    language: '',
    tags: [],
    readingTime: 0
  };

  // Title extraction (multiple sources)
  metadata.title = 
    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    document.querySelector('title')?.textContent ||
    document.querySelector('h1')?.textContent ||
    '';

  // Author extraction (comprehensive approach like Obsidian Clipper)
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]', 
    'meta[property="og:article:author"]',
    'meta[name="twitter:creator"]',
    '[rel="author"]',
    '.byline',
    '.author',
    '.writer',
    '.post-author',
    '.article-author',
    '[class*="author"]',
    '[data-author]'
  ];
  
  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        metadata.author = element.getAttribute('content');
      } else {
        metadata.author = element.textContent?.trim();
      }
      if (metadata.author) break;
    }
  }

  // WeChat specific author extraction
  if (window.location.hostname === 'mp.weixin.qq.com') {
    const wechatAuthor = document.querySelector('#js_name, .rich_media_meta_text, .account_nickname_inner');
    if (wechatAuthor) {
      metadata.author = wechatAuthor.textContent?.trim() || metadata.author;
    }
  }

  // Published date extraction (like Obsidian Clipper)
  const publishedSources = [
    'meta[property="article:published_time"]',
    'meta[property="og:article:published_time"]',
    'meta[name="publish_date"]',
    'meta[name="date"]',
    'meta[name="DC.date"]',
    'time[datetime]',
    'time[pubdate]',
    '[datetime]'
  ];

  for (const selector of publishedSources) {
    const element = document.querySelector(selector);
    if (element) {
      let dateValue = element.getAttribute('content') || 
                      element.getAttribute('datetime') || 
                      element.textContent;
      
      if (dateValue) {
        // Try to parse and format the date
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            metadata.published = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            break;
          }
        } catch (e) {
          console.warn('Failed to parse date:', dateValue);
        }
      }
    }
  }

  // WeChat specific publish date
  if (window.location.hostname === 'mp.weixin.qq.com') {
    const wechatTime = document.querySelector('#publish_time, .rich_media_meta_text');
    if (wechatTime && !metadata.published) {
      const timeText = wechatTime.textContent?.trim();
      if (timeText) {
        try {
          const date = new Date(timeText);
          if (!isNaN(date.getTime())) {
            metadata.published = date.toISOString().split('T')[0];
          }
        } catch (e) {
          metadata.published = timeText; // Keep as text if parsing fails
        }
      }
    }
  }

  // Description extraction
  metadata.description = 
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    '';

  // WeChat specific description
  if (window.location.hostname === 'mp.weixin.qq.com') {
    const wechatDesc = document.querySelector('.rich_media_meta_text');
    if (wechatDesc && !metadata.description) {
      metadata.description = wechatDesc.textContent?.trim() || '';
    }
  }

  // Site name
  metadata.siteName = 
    document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    document.querySelector('meta[name="application-name"]')?.getAttribute('content') ||
    window.location.hostname;

  // Canonical URL
  metadata.canonical = 
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    document.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    window.location.href;

  // Language
  metadata.language = 
    document.documentElement.lang ||
    document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ||
    'en';

  // Keywords/Tags extraction
  const keywordsEl = document.querySelector('meta[name="keywords"]');
  if (keywordsEl) {
    const keywords = keywordsEl.getAttribute('content');
    if (keywords) {
      metadata.tags = keywords.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  }

  // Article tags (additional sources)
  const tagSelectors = [
    '.tags a',
    '.tag',
    '.post-tags a', 
    '.article-tags a',
    '[rel="tag"]',
    '.hashtag'
  ];
  
  for (const selector of tagSelectors) {
    const tagElements = document.querySelectorAll(selector);
    if (tagElements.length > 0) {
      const additionalTags = Array.from(tagElements)
        .map(el => el.textContent?.trim())
        .filter(tag => tag && tag.length > 0);
      metadata.tags = [...new Set([...metadata.tags, ...additionalTags])];
      break;
    }
  }

  // Estimate reading time
  const contentText = document.body.textContent || '';
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = contentText.trim().split(/\s+/).length;
  metadata.readingTime = Math.ceil(wordCount / wordsPerMinute);

  // Clean and validate metadata
  Object.keys(metadata).forEach(key => {
    if (typeof metadata[key] === 'string') {
      metadata[key] = metadata[key].trim();
    }
  });

  console.log('✅ Enhanced metadata extracted:', {
    title: metadata.title.substring(0, 50) + '...',
    author: metadata.author,
    published: metadata.published,
    description: metadata.description.substring(0, 100) + '...',
    siteName: metadata.siteName,
    tagsCount: metadata.tags.length,
    readingTime: metadata.readingTime
  });

  return metadata;
}

// Enhanced content extraction with metadata
async function extractArticleWithEnhancedMetadata() {
  try {
    console.log('🚀 Starting enhanced extraction with metadata...');
    
    // First extract metadata
    const metadata = extractEnhancedMetadata(document);
    
    // Then extract content using existing logic
    const article = await extractArticle();
    
    // Merge metadata with article content
    const enhancedArticle = {
      ...article,
      ...metadata,
      // Preserve original fields but enhance with metadata
      title: metadata.title || article.title,
      author: metadata.author || article.author,
      publishTime: metadata.published || article.publishTime,
      digest: metadata.description || article.digest,
      url: metadata.canonical || article.url,
      
      // Additional metadata fields
      siteName: metadata.siteName,
      language: metadata.language,
      tags: metadata.tags,
      readingTime: metadata.readingTime,
      created: metadata.created,
      
      // Enhanced extraction indicator
      extractionMethod: article.extractionMethod + '-enhanced-metadata'
    };

    console.log('🎯 Enhanced article with metadata:', {
      title: enhancedArticle.title.substring(0, 50) + '...',
      author: enhancedArticle.author,
      published: enhancedArticle.publishTime,
      siteName: enhancedArticle.siteName,
      tagsCount: enhancedArticle.tags.length,
      contentLength: enhancedArticle.content.length,
      method: enhancedArticle.extractionMethod
    });

    return enhancedArticle;
    
  } catch (error) {
    console.error('❌ Enhanced extraction failed:', error);
    // Fallback to regular extraction
    return await extractArticle();
  }
}

async function downloadImage(imageUrl, options = {}) {
  try {
    console.log(`🖼️ 开始下载图片: ${imageUrl.substring(0, 80)}...`);
    
    // 添加防盗链headers
    const response = await fetch(imageUrl, {
      headers: {
        'Referer': window.location.href,
        'User-Agent': navigator.userAgent
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`📦 图片下载成功: ${Math.round(blob.size / 1024)}KB`);
    
    // 验证是否为图片
    if (!blob.type.startsWith('image/')) {
      throw new Error(`文件类型错误: ${blob.type}, 期望图片类型`);
    }
    
    // 如果启用压缩，处理图片
    if (options.enableCompression) {
      const compressedDataUrl = await compressImage(blob, options);
      console.log(`🗜️ 图片压缩完成`);
      return compressedDataUrl;
    } else {
      // 直接转换为data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
    
  } catch (error) {
    console.error(`❌ 图片下载失败 (${imageUrl}):`, error);
    return null;
  }
}

// 智能图片压缩函数
async function compressImage(blob, options = {}) {
  const {
    quality = 0.8,
    maxWidth = 1200,
    maxHeight = 800,
    format = 'image/jpeg'
  } = options;
  
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        console.log(`📏 调整图片尺寸: ${img.width}x${img.height} → ${width}x${height}`);
      }
      
      // 设置canvas尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height);
      
      // 输出压缩后的图片
      const compressedDataUrl = canvas.toDataURL(format, quality);
      
      // 计算压缩率
      const originalSize = blob.size;
      const compressedSize = Math.round(compressedDataUrl.length * 0.75); // base64大约比原始大33%
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
      
      console.log(`🎯 压缩统计: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (压缩${compressionRatio}%)`);
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      console.warn('⚠️ 图片压缩失败，使用原图');
      // 如果压缩失败，返回原图
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    };
    
    // 创建图片对象URL
    img.src = URL.createObjectURL(blob);
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'extract') {
    console.log('Received extract request - using enhanced metadata extraction');
    
    // Use enhanced metadata extraction
    extractArticleWithEnhancedMetadata().then(articleData => {
      console.log('Extracted article data with enhanced metadata:', {
        method: articleData.extractionMethod,
        title: articleData.title,
        author: articleData.author,
        published: articleData.publishTime,
        siteName: articleData.siteName,
        contentLength: articleData.content ? articleData.content.length : 0,
        wordCount: articleData.wordCount,
        imageCount: articleData.images ? articleData.images.length : 0,
        tagsCount: articleData.tags ? articleData.tags.length : 0,
        readingTime: articleData.readingTime
      });
      sendResponse(articleData);
    }).catch(error => {
      console.error('Enhanced extraction failed:', error);
      sendResponse({ error: error.message });
    });
    
    return true; // Keep message channel open for async response
  } else if (msg.type === 'downloadImage') {
    const options = {
      enableCompression: msg.enableCompression || false,
      quality: msg.quality || 0.8,
      maxWidth: msg.maxWidth || 1200,
      maxHeight: msg.maxHeight || 800
    };
    
    downloadImage(msg.url, options).then(dataUrl => {
      if (dataUrl) {
        sendResponse({ success: true, dataUrl });
      } else {
        sendResponse({ success: false, error: '图片下载失败' });
      }
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Add debug information to console
// 辅助函数：验证图片URL是否有效
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // 过滤掉无效的URL类型
  const invalidPrefixes = [
    'data:',                    // base64图片
    'chrome-extension://',      // 浏览器扩展链接
    'moz-extension://',         // Firefox扩展链接
    'chrome://',               // Chrome内部页面
    'about:',                  // 浏览器内部页面
    'javascript:',             // JavaScript代码
    'blob:',                   // Blob URL（通常是临时的）
    'extension://'             // 通用扩展前缀
  ];
  
  // 检查是否是无效前缀
  for (const prefix of invalidPrefixes) {
    if (url.startsWith(prefix)) {
      console.log(`🚫 过滤无效图片链接: ${url.substring(0, 50)}... (${prefix})`);
      return false;
    }
  }
  
  // 检查是否是有效的HTTP(S) URL
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      console.log(`🚫 过滤非HTTP图片链接: ${url.substring(0, 50)}... (${urlObj.protocol})`);
      return false;
    }
  } catch (error) {
    console.log(`🚫 过滤无效URL格式: ${url.substring(0, 50)}...`);
    return false;
  }
  
  return true;
}

console.log('Enhanced Smart Article Extractor content script loaded with Defuddle support');
console.log('Current domain:', window.location.hostname);
console.log('Defuddle available at load:', typeof defuddle__WEBPACK_IMPORTED_MODULE_0__);

// 🛡️ 启动Extension清理器以阻止其他Extension注入
startExtensionCleanupWatcher(); 
})();

/******/ })()
;