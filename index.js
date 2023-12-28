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
  aside,
} = require("@saltcorn/markup/tags");
const renderLayout = require("@saltcorn/markup/layout");
const { renderForm, link } = require("@saltcorn/markup");
const {
  headersInHead,
  headersInBody,
} = require("@saltcorn/markup/layout_utils");
const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const db = require("@saltcorn/data/db");

const hints = {};
const verstring = "@" + require("./package.json").version;

const subItem = (currentUrl) => (item) =>
  li(
    item.link
      ? a(
          {
            class: ["dropdown-item", active(currentUrl, item) && "active"],
            href: text(item.link),
          },
          item.icon ? i({ class: `me-1 fa-fw ${item.icon}` }) : "",
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
              "data-bs-toggle": "dropdown",
              role: "button",
              "aria-expanded": "false",
            },
            //i({ class: "fas fa-fw fa-wrench" }),
            item.icon
              ? span(
                  { class: "nav-link-icon" },
                  i({ class: `mt-2 fa-fw ${item.icon}` })
                )
              : "",
            span({ class: "nav-link-title" }, text(item.label))
          ),
          ul(
            {
              class: [
                "dropdown-menu",
                ix === nitems - 1 && "dropdown-menu-end",
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
                i({ class: `mt-2 fa-fw ${item.icon}` })
              )
            : "",
          text(item.label)
        )
      : span({ class: "nav-link" }, text(item.label))
  );
};

const sideBarSection = (currentUrl) => (section) =>
  [
    //section.section &&
    //  li({ class: "nav-header text-uppercase" }, section.section),
    section.items.map(sideBarItem(currentUrl, section.items.length)).join(""),
  ];

const splitPrimarySecondaryMenu = (menu) => {
  return {
    primary: menu
      .map((mi) => ({
        ...mi,
        items: mi.items.filter(
          (item) => item.location !== "Secondary Menu" && mi.section !== "User"
        ),
      }))
      .filter(({ items }) => items.length),
    secondary: menu
      .map((mi) => ({
        ...mi,
        items: mi.items.filter(
          (item) => item.location === "Secondary Menu" || mi.section === "User"
        ),
      }))
      .filter(({ items }) => items.length),
  };
};

const showBrand = (brand) =>
  a(
    {
      href: "/",
      class: "navbar-brand navbar-brand-autodark d-none-navbar-horizontal",
    },
    brand.logo &&
      img({
        src: brand.logo,
        alt: "Logo",
        class: "navbar-brand-image mx-1",
      }),
    brand.name
  );

const header_sections = (brand, sections, currentUrl, config) => {
  switch (config?.layout_style) {
    case "Vertical":
      return vertical_header_sections(brand, sections, currentUrl, config);
    case "Condensed":
      return condensed_header_sections(brand, sections, currentUrl, config);
    case "Combined": {
      const { primary, secondary } = splitPrimarySecondaryMenu(sections);
      return combined_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config
      );
    }
    default: //Horizontal
      const { primary, secondary } = splitPrimarySecondaryMenu(sections);
      return horizontal_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config
      );
  }
};

const horizontal_header_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config
) =>
  header(
    { class: "navbar navbar-expand-md navbar-light d-print-none" },
    div(
      { class: "container-xl" },
      button(
        {
          class: "navbar-toggler",
          type: "button",
          "data-bs-toggle": "collapse",
          "data-bs-target": "#navbar-menu",
        },
        span({ class: "navbar-toggler-icon" })
      ),
      showBrand(brand),
      div(
        { class: "navbar-nav flex-row order-md-last" },
        secondary.map(sideBarSection(currentUrl))
      )
    )
  ) +
  header(
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
            primary.map(sideBarSection(currentUrl))
          )
        )
      )
    )
  );

const combined_header_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config
) =>
  vertical_header_sections(brand, primary, currentUrl, config) +
  header(
    { class: "navbar navbar-expand-md d-none d-lg-flex d-print-none" },
    div(
      { class: "container-xl" },
      button(
        {
          class: "navbar-toggler",
          type: "button",
          "data-bs-toggle": "collapse",
          "data-bs-target": "#navbar-menu",
        },
        span({ class: "navbar-toggler-icon" })
      ),
      div(
        { class: "navbar-nav flex-row order-md-last" },
        secondary.map(sideBarSection(currentUrl))
      ),
      div({ class: "collapse navbar-collapse", id: "navbar-menu" })
    )
  );

const condensed_header_sections = (brand, sections, currentUrl, config) =>
  header(
    { class: "navbar navbar-expand-md d-print-none" },
    div(
      { class: "container-xl" },
      button(
        {
          class: "navbar-toggler",
          type: "button",
          "data-bs-toggle": "collapse",
          "data-bs-target": "#navbar-menu",
        },
        span({ class: "navbar-toggler-icon" })
      ),
      showBrand(brand),
      div(
        { class: "collapse navbar-collapse", id: "navbar-menu" },
        div(
          {
            class:
              "d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center",
          },
          div(
            { class: "navbar-nav flex-row order-md-last" },
            sections.map(sideBarSection(currentUrl))
          )
        )
      )
    )
  );
const vertical_header_sections = (brand, sections, currentUrl, config) =>
  aside(
    {
      class: "navbar navbar-vertical navbar-expand-lg d-print-none",
      "data-bs-theme": "dark",
    },
    div(
      { class: "container-fluid" },
      button(
        {
          class: "navbar-toggler",
          type: "button",
          "data-bs-toggle": "collapse",
          "data-bs-target": "#sidebar-menu",
        },
        span({ class: "navbar-toggler-icon" })
      ),
      showBrand(brand),
      div(
        { class: "navbar-nav flex-row d-lg-none" },
        sections.map(sideBarSection(currentUrl))
      ),
      div(
        { class: "collapse navbar-collapse", id: "sidebar-menu" },
        div(
          { class: "navbar-nav pt-lg-3" },
          sections.map(sideBarSection(currentUrl))
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
const renderBody = (title, body, role, config) =>
  renderLayout({
    blockDispatch,
    role,
    hints,
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

    <link rel="stylesheet" href="/plugins/public/tabler${verstring}/fontawesome/fontawesome.min.css" />
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
    <link rel="stylesheet" href="/plugins/public/tabler${verstring}/tabler.min.css">
    ${headersInHead(headers)}
    <title>${text(title)}</title>
  </head>
  <body ${bodyAttr}>
  ${body}
  <script src="/static_assets/${
    db.connectObj.version_tag
  }/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" 
   integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" 
   crossorigin="anonymous"></script>
  <script src="/plugins/public/tabler${verstring}/tabler.min.js"></script>

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

const renderAuthMethodLinks = (authLinks) => {
  const methods = authLinks.methods || [];
  if (methods.length === 0) return "";
  const line = div({ class: "hr-text" }, "or");
  const buttons = methods.map(({ url, icon, label }) =>
    div(
      { class: "col" },
      a(
        { href: url, class: "btn btn-white w-100" },
        icon || "",
        `&nbsp;Login with ${label}`
      )
    )
  );
  return line + div({ class: "card-body" }, div({ class: "row" }, buttons));
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
            <div class="card-body">
              <div class="card-title">${title}</div>
              ${renderForm(formModify(form), csrfToken)}
            </div>
            ${renderAuthMethodLinks(authLinks)}
          
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

const wrap =
  (config) =>
  ({
    title,
    menu,
    brand,
    alerts,
    currentUrl,
    body,
    headers,
    role,
    req,
    bodyClass,
  }) =>
    wrapIt(
      `class="antialiased ${bodyClass || ""}"`,
      headers,
      title,
      `<div id="page">
        ${header_sections(brand, menu, currentUrl, config)}
        <div class="page-wrapper">
            <div class="container-xl" id="page-inner-content">
            <div id="alerts-area">
              ${alerts.map((a) => alert(a.type, a.msg)).join("")}
            </div>
            ${renderBody(title, body, role, config)}
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

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "settings",
        form: async () => {
          return new Form({
            saveAndContinueOption: true,
            fields: [
              {
                name: "layout_style",
                label: "Layout style",
                type: "String",
                required: true,
                //fieldview: "radio_group",
                attributes: {
                  inline: true,
                  options: ["Horizontal", "Vertical", "Condensed", "Combined"],
                },
              },
              {
                name: "fluid",
                label: "Fluid",
                type: "Bool",
              },
            ],
          });
        },
      },
    ],
  });

const layout = (config) => ({
  wrap: wrap(config),
  authWrap,
  hints,
  renderBody: ({ title, body, alerts, role }) =>
    renderBody(title, body, role, config),
});

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "tabler",
  configuration_workflow,
  layout,
};
