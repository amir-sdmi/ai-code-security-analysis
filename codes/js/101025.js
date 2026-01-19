//CREATED USING CHATGPT

// Set header content in local storage
function setHeaderContent(content) {
  localStorage.setItem('headerContent', content);
}

// Get header content from local storage
function getHeaderContent() {
  return localStorage.getItem('headerContent');
}

// Set footer content in local storage
function setFooterContent(content) {
  localStorage.setItem('footerContent', content);
}

// Get footer content from local storage
function getFooterContent() {
  return localStorage.getItem('footerContent');
}

// Set the header and footer content
setHeaderContent(`
<nav>
	<ul class="navigation">
		<li><a id="active" href="s_HomePage.html">Home</a></li>
		<li><a id="active" href="s_About.html">About Us</a></li>
		<li><a id="inactive" href="underConstruction.html">Products</a></li>
		<li><a id="inactive" href="underConstruction.html">Jobs</a></li>
		<li><a id="inactive" href="underConstruction.html">Reviews</a></li>
		<li><a id="inactive" href="underConstruction.html">Contact Us</a></li>
		<li><a id="inactive" href="underConstruction.html">News</a></li>
	</ul>
	<input type="text" placeholder="Search..">
</nav>
<div class="nameLogo">
	<img src="imgs/header.jpg" alt="ionLionTechnologies" id="header" />
</div>
`);

setFooterContent(`
  <img src="imgs/logo.png" alt="ionLionTechnologies" id="logo" />
	  <nav class="verticalNavigation" id="left">
	  <div class="nam">
		<h1><cite>ionLion</cite></h1>
		Know the lion by the claw
		</div>
			  <div id="creditA">Logo Credit: Sindhura Lukka</div>
	  </nav>

	  <nav class="verticalNavigation" id="middle">
		 <ul>
			<li><b><a id="active" href="s_About.html">Who We Are</a></b></li>
			<li><b><a id="inactive" href="underConstruction.html">Why We're Different</a></b></li>
			<li><b><a id="inactive" href="underConstruction.html">Products & Services</a></b></li>
			<li><b><a id="inactive" href="underConstruction.html">Careers</a></b></li>
			<li><b><a id="inactive" href="underConstruction.html">Investors</a></b></li>
			<li><b><a id="inactive" href="underConstruction.html">News</a></b></li>
		 </ul>
	  </nav>
	  <nav class="verticalNavigation" id="right">
		 <ul>
			<li><a id="inactive" href="underConstruction.html">CONTACT</a></li>
			<li><a id="inactive" href="underConstruction.html">EQUAL OPPORTUNITY EMPLOYER</a></li>
			<li><a id="inactive" href="underConstruction.html">PRIVACY POLICY</a></li>
			<li><a id="inactive" href="underConstruction.html">TERMS & CONDITIONS</a></li>
			<li><a id="inactive" href="underConstruction.html">PURCHASE ORDER TERMS & CONDITIONS</a></li>
			<li><a id="inactive" href="underConstruction.html">SITE MAP</a></li>
		
			<a href="https://www.linkedin.com/"><img src="imgs/social-linkedin.png"></a>
			<a href="https://www.facebook.com/"><img src="imgs/social-facebook.png"></a>
			<a href="https://twitter.com/"><img src="imgs/social-twitter.png"></a>
			<a href="https://www.youtube.com/"><img src="imgs/social-youtube.png"></a>
			<div class="copyright"></br>Copyright © 2023 ionLion Technologies </br></br></div>
			<div id="creditB">Website developed by Nathan Scott.</div>
		 </ul>

		 
	  </nav>
`);
