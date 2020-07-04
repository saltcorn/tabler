const {
  ul,
  li,
  a,
  span,
  hr,
  div,
  text,
  i,
  h6,
  h1,
  p,
  header,
  footer,
  mkTag,
  nav
} = require("@saltcorn/markup/tags");
const renderLayout = require("@saltcorn/markup/layout");
const aside = mkTag("aside");
const subItem = currentUrl => item =>
  li(
    { class: "nav-item" },
    item.link
      ? a(
          {
            class: ["nav-link", active(currentUrl, item) && "active"],
            href: text(item.link)
          },
          i({ class: "far fa-circle nav-icon" }),
          p(item.label)
        )
      : h6({ class: "collapse-header" }, item.label)
  );

const labelToId = item => text(item.label.replace(" ", ""));

const logit = (x, s) => {
  if (s) console.log(s, x);
  else console.log(x);
  return x;
};
const active = (currentUrl, item) =>
  (item.link && currentUrl.startsWith(item.link)) ||
  (item.subitems &&
    item.subitems.some(si => si.link && currentUrl.startsWith(si.link)));

const sideBarItem = currentUrl => item => {
  const is_active = active(currentUrl, item);
  return li(
    {
      class: [
        "nav-item",
        item.subitems && "has-treeview",
        item.subitems && is_active && "menu-open"
      ]
    },
    item.link
      ? a(
          { class: ["nav-link", is_active && "active"], href: text(item.link) },
          p(text(item.label))
        )
      : item.subitems
      ? [
          a(
            {
              class: ["nav-link", is_active && "active"],
              href: "#"
            },
            //i({ class: "fas fa-fw fa-wrench" }),
            p(text(item.label), i({ class: "right fas fa-angle-left" }))
          ),
          ul(
            {
              class: ["nav nav-treeview"]
            },
            item.subitems.map(subItem(currentUrl))
          )
        ]
      : span({ class: "nav-link" }, text(item.label))
  );
};

const sideBarSection = currentUrl => section => [
  section.section &&
    li({ class: "nav-header text-uppercase" }, section.section),
  section.items.map(sideBarItem(currentUrl)).join("")
];

const sidebar = (brand, sections, currentUrl) =>
  aside(
    { class: "main-sidebar sidebar-dark-primary elevation-4" },
    a(
      {
        class: "brand-link",
        href: "/"
      },
      //div({class:"sidebar-brand-icon rotate-n-15"},
      //i({class:"fas fa-laugh-wink"})),
      span({ class: "brand-text font-weight-light" }, brand.name)
    ),
    div(
      { class: "sidebar" },
      nav(
        { class: "mt-2" },
        ul(
          {
            class: "nav nav-pills nav-sidebar flex-column",
            "data-widget": "treeview",
            role: "menu",
            "data-accordion": "false",
            id: "accordionSidebar"
          },
          sections.map(sideBarSection(currentUrl))
        )
      )
    )
  );

const blockDispatch = {
  pageHeader: ({ title, blurb }) =>
    div(
      h1({ class: "h3 mb-0 mt-2 text-gray-800" }, title),
      blurb && p({ class: "mb-0 text-gray-800" }, blurb)
    ),
  footer: ({ contents }) =>
    div(
      { class: "container" },
      footer(
        { id: "footer" },
        div({ class: "row" }, div({ class: "col-sm-12" }, contents))
      )
    ),
  hero: ({ caption, blurb }) =>
    header(
      { class: "masthead" },
      div(
        { class: "container h-100" },
        div(
          {
            class:
              "row h-100 align-items-center justify-content-center text-center"
          },
          div(
            { class: "col-lg-10 align-self-end" },
            h1({ class: "text-uppercase font-weight-bold" }, caption),
            hr({ class: "divider my-4" })
          ),
          div(
            { class: "col-lg-8 align-self-baseline" },
            p({ class: "font-weight-light mb-5" }, blurb)
            /*a(
              {
                class: "btn btn-primary btn-xl",
                href: "#about"
              },
              "Find Out More"
            )*/
          )
        )
      )
    )
};
const renderBody = (title, body) =>
  renderLayout({
    blockDispatch,
    layout:
      typeof body === "string" ? { type: "card", title, contents: body } : body
  });

const wrap = ({
  title,
  menu,
  brand,
  alerts,
  currentUrl,
  body,
  headers
}) => `<!doctype html>
<html lang="en">
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <script defer src="https://use.fontawesome.com/releases/v5.13.0/js/all.js" crossorigin="anonymous"></script>
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabler@1.0.0-alpha.7/dist/css/tabler.min.css" 
          integrity="sha256-pqiuW1qcWlMprs8p96Yvsxp5Cq9C8duKeqWJInj7mJ8=" crossorigin="anonymous">
    ${headers
      .filter(h => h.css)
      .map(h => `<link href="${h.css}" rel="stylesheet">`)
      .join("")}
    ${headers
      .filter(h => h.headerTag)
      .map(h => h.headerTag)
      .join("")}
    <title>${text(title)}</title>
  </head>
  <body id="page-top" class="hold-transition sidebar-mini layout-fixed">
    <div id="wrapper">
      ${sidebar(brand, menu, currentUrl)}

      <div class="content-wrapper">
        <section id="content">
          <div class="container-fluid">
            ${alerts.map(a => alert(a.type, a.msg)).join("")}
            ${renderBody(title, body)}
          </div>
        </div>
      </div>
    </div>
    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.4.1.min.js" 
            integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" 
            crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/startbootstrap-sb-admin-2@4.0.7/vendor/bootstrap/js/bootstrap.bundle.min.js" integrity="sha256-fzFFyH01cBVPYzl16KT40wqjhgPtq6FFUB6ckN2+GGw=" crossorigin="anonymous"></script>

    <!-- Core plugin JavaScript-->
    <script src="https://cdn.jsdelivr.net/npm/startbootstrap-sb-admin-2@4.0.7/vendor/jquery-easing/jquery.easing.min.js" integrity="sha256-H3cjtrm/ztDeuhCN9I4yh4iN2Ybx/y1RM7rMmAesA0k=" crossorigin="anonymous"></script>
  
    <script src="https://cdn.jsdelivr.net/npm/tabler@1.0.0-alpha.7/dist/js/tabler.min.js" 
            integrity="sha256-lr8FqPNz4evR1M4/FBrpwOJ8G7dcD9Em7MHOhTXaAKc=" crossorigin="anonymous"></script>
    ${headers
      .filter(h => h.script)
      .map(
        h =>
          `<script src="${h.script}" ${
            h.integrity
              ? `integrity="${h.integrity}" crossorigin="anonymous"`
              : ""
          }></script>`
      )
      .join("")}
  </body>
</html>`;

const alert = (type, s) => {
  //console.log("alert", type, s,s.length)
  const realtype = type === "error" ? "danger" : type;
  return s && s.length > 0
    ? `<div class="alert alert-${realtype} alert-dismissible fade show" role="alert">
  ${text(s)}
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
</div>`
    : "";
};

module.exports = { sc_plugin_api_version: 1, layout: { wrap } };
