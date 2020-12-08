// implementing https://preview-dev.tabler.io/index.html

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
  h2,
  h3,
  h1,
  p,
  header,
  footer,
  mkTag,
  button,
  nav,
  img,
} = require("@saltcorn/markup/tags");
const renderLayout = require("@saltcorn/markup/layout");
const { renderForm, link } = require("@saltcorn/markup");
const {
  headersInHead,
  headersInBody,
} = require("@saltcorn/markup/layout_utils");

const subItem = (currentUrl) => (item) =>
  li(
    item.link
      ? a(
          {
            class: ["dropdown-item", active(currentUrl, item) && "active"],
            href: text(item.link),
          },
          item.icon ? i({ class: `fa-fw ${item.icon}` }) : "",
          item.label
        )
      : span({ class: "dropdown-header" }, item.label)
  );

const labelToId = (item) => text(item.label.replace(" ", ""));

const logit = (x, s) => {
  if (s) console.log(s, x);
  else console.log(x);
  return x;
};
const active = (currentUrl, item) =>
  (item.link && currentUrl.startsWith(item.link)) ||
  (item.subitems &&
    item.subitems.some((si) => si.link && currentUrl.startsWith(si.link)));

const sideBarItem = (currentUrl, nitems) => (item, ix) => {
  const is_active = active(currentUrl, item);
  return li(
    {
      class: ["nav-item", is_active && "active", item.subitems && "dropdown"],
    },
    item.subitems
      ? [
          a(
            {
              class: "nav-link dropdown-toggle",
              href: "#",
              "data-toggle": "dropdown",
              role: "button",
              "aria-expanded": "false",
            },
            //i({ class: "fas fa-fw fa-wrench" }),
            item.icon
              ? span(
                  { class: "nav-link-icon" },
                  i({ class: `fa-fw ${item.icon}` })
                )
              : "",
            span({ class: "nav-link-title" }, text(item.label))
          ),
          ul(
            {
              class: [
                "dropdown-menu",
                ix === nitems - 1 && "dropdown-menu-right",
              ],
            },

            item.subitems.map(subItem(currentUrl))
          ),
        ]
      : item.link
      ? a(
          { class: ["nav-link"], href: text(item.link) },
          item.icon
            ? span(
                { class: "nav-link-icon" },
                i({ class: `fa-fw ${item.icon}` })
              )
            : "",
          text(item.label)
        )
      : span({ class: "nav-link" }, text(item.label))
  );
};

const sideBarSection = (currentUrl) => (section) => [
  //section.section &&
  //  li({ class: "nav-header text-uppercase" }, section.section),
  section.items.map(sideBarItem(currentUrl, section.items.length)).join(""),
];

const header_sections = (brand, sections, currentUrl) =>
  header(
    { class: "navbar navbar-expand-md navbar-light d-print-none" },
    div(
      { class: "container-xl" },
      button(
        {
          class: "navbar-toggler",
          type: "button",
          "data-toggle": "collapse",
          "data-target": "#navbar-menu",
        },
        span({ class: "navbar-toggler-icon" })
      ),
      a(
        {
          href: ".",
          class:
            "navbar-brand navbar-brand-autodark d-none-navbar-horizontal pr-0 pr-md-3",
        },
        brand.logo &&
          img({
            src: brand.logo,
            alt: "Logo",
            class: "navbar-brand-image mx-1",
          }),
        brand.name
      ),

      div(
        { class: "navbar-nav flex-row order-md-last" },
        sections
          .filter((s) => s.section === "User" || s.isUser)
          .map(sideBarSection(currentUrl))
      )
    )
  ) +
  div(
    { class: "navbar-expand-md" },
    div(
      { class: "collapse navbar-collapse", id: "navbar-menu" },
      div(
        { class: "navbar navbar-light" },
        div(
          { class: "container-xl" },
          ul(
            {
              class: "navbar-nav",
            },
            sections
              .filter((s) => s.section !== "User" && !s.isUser)
              .map(sideBarSection(currentUrl))
          )
        )
      )
    )
  );

const blockDispatch = {
  pageHeader: ({ title, blurb }) =>
    div(
      { class: "page-header" },
      h2({ class: "page-title" }, title),
      blurb && p({ class: "mb-0 text-gray-800" }, blurb)
    ),
  card: ({ title, contents, footer }, go) =>
    div(
      { class: "card" },
      title &&
        div({ class: "card-header" }, h3({ class: "card-title" }, text(title))),
      div({ class: "card-body" }, go(contents)),
      footer && div({ class: "card-footer" }, go(footer))
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
              "row h-100 align-items-center justify-content-center text-center",
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
    ),
};
const renderBody = (title, body, role) =>
  renderLayout({
    blockDispatch,
    role,
    layout:
      typeof body === "string"
        ? {
            above: [
              { type: "pageHeader", title },
              { type: "card", contents: body },
            ],
          }
        : body,
  });
const wrapIt = (bodyAttr, headers, title, body) => `<!doctype html>
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
    ${headersInHead(headers)}
    <title>${text(title)}</title>
  </head>
  <body ${bodyAttr}>
  ${body}
  <script src="https://code.jquery.com/jquery-3.4.1.min.js" 
          integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" 
          crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" 
   integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" 
   crossorigin="anonymous"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.bundle.min.js" 
    integrity="sha384-xrRywqdh3PHs8keKZN+8zzc5TX0GRTLCcmivcbNJWm2rs5C8PRhcEn3czEjhAO9o" 
    crossorigin="anonymous"></script>

    ${headersInBody(headers)}
    <style>
      .form-group {
        margin-bottom: 1rem;
      }
      .nav-link-icon {
        margin-top: -8px;
        margin-right: 3px;
      }
    </style>
</body>
</html>`;

const renderAuthLinks = (authLinks) => {
  var links = [];
  if (authLinks.login)
    links.push(link(authLinks.login, "Already have an account? Login!"));
  if (authLinks.forgot) links.push(link(authLinks.forgot, "Forgot password?"));
  if (authLinks.signup)
    links.push(link(authLinks.signup, "Create an account!"));
  if (links.length === 0) return "";
  else
    return links
      .map((l) => div({ class: "text-center text-muted" }, l))
      .join("");
};

const formModify = (form) => {
  form.formStyle = "vert";
  form.submitButtonClass = "btn-primary btn-user btn-block";
  return form;
};

const authBrand = ({ name, logo }) =>
  logo
    ? `<div class="text-center mb-4">
    <img src="${logo}" class="h-6" alt=""><h2 class="d-inline mx-3">${name}</h2>
  </div>`
    : "";

const authWrap = ({
  title,
  alerts,
  form,
  afterForm,
  brand,
  headers,
  csrfToken,
  authLinks,
}) =>
  wrapIt(
    "",
    headers,
    title,
    `<div class="page">
  <div class="page-single">
    <div class="container">
      <div class="row">
        <div class="col col-login mx-auto">
        ${alerts.map((a) => alert(a.type, a.msg)).join("")}
        ${authBrand(brand)}
          <div class="card">
            <div class="card-body p-5">
              <div class="card-title">${title}</div>
              ${renderForm(formModify(form), csrfToken)}
            </div>
          
          </div>

          ${renderAuthLinks(authLinks)}
          ${afterForm}
        </div>
      </div>
    </div>
  </div>
  <style>
  .col-login {
    max-width: 24rem;
  }
  .page-single {
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
    align-items: center;
    -ms-flex-pack: center;
    justify-content: center;
    padding: 1rem 0;
}
  </style>
</div>`
  );

const wrap = ({
  title,
  menu,
  brand,
  alerts,
  currentUrl,
  body,
  headers,
  role,
}) =>
  wrapIt(
    'class="antialiased"',
    headers,
    title,
    `<div id="page">
        ${header_sections(brand, menu, currentUrl)}
        <div class="content">
            <div class="container-xl">
              ${alerts.map((a) => alert(a.type, a.msg)).join("")}
              ${renderBody(title, body, role)}
            </div>
        </div>
    </div>`
  );

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

module.exports = { sc_plugin_api_version: 1, layout: { wrap, authWrap } };
