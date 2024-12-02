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
  form,
  input,
} = require("@saltcorn/markup/tags");
const renderLayout = require("@saltcorn/markup/layout");
const { renderForm, link } = require("@saltcorn/markup");
const {
  headersInHead,
  headersInBody,
  alert,
} = require("@saltcorn/markup/layout_utils");
const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const Table = require("@saltcorn/data/models/table");
const Plugin = require("@saltcorn/data/models/plugin");
const User = require("@saltcorn/data/models/user");
const db = require("@saltcorn/data/db");
const { sleep } = require("@saltcorn/data/utils");
const { getState } = require("@saltcorn/data/db/state");

const hints = {
  cardTitleClass: "card-title",
};
const verstring = "@" + require("./package.json").version;

const subItem = (currentUrl) => (item) =>
  li(
    item.link
      ? a(
          {
            class: ["dropdown-item", active(currentUrl, item) && "active"],
            href: text(item.link),
          },
          item.icon && item.icon !== "empty" && item.icon !== "undefined"
            ? i({ class: `me-1 fa-fw ${item.icon}` })
            : "",
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
  (item.altlinks && item.altlinks.some((l) => currentUrl.startsWith(l))) ||
  (item.subitems &&
    item.subitems.some(
      (si) =>
        (si.link && currentUrl.startsWith(si.link)) ||
        (si.altlinks && si.altlinks.some((l) => currentUrl.startsWith(l)))
    ));

const sideBarItem = (currentUrl, config, user, nitems, horiz) => (item, ix) => {
  const is_active = active(currentUrl, item);
  if (
    item.isUser &&
    config?.avatar_file &&
    user &&
    user[config?.avatar_file] &&
    config?.layout_style !== "Vertical"
  ) {
    return li(
      {
        class: ["nav-item dropdown", is_active && "active"],
      },
      a(
        {
          class: "nav-link",
          href: "#",
          "data-bs-toggle": "dropdown",
          role: "button",
          "aria-expanded": "false",
        },
        span({
          class: "avatar avatar-sm",
          style: `background-image: url(/files/resize/64/64/${
            user?.[config.avatar_file]
          })`,
        })
      ),
      ul(
        {
          class: ["dropdown-menu", ix === nitems - 1 && "dropdown-menu-end"],
        },
        item.subitems.map(subItem(currentUrl))
      )
    );
  } else if (
    item.isUser &&
    user?.email &&
    config?.layout_style !== "Vertical"
  ) {
    return li(
      {
        class: ["nav-item dropdown", is_active && "active"],
      },
      a(
        {
          class: "nav-link",
          href: "#",
          "data-bs-toggle": "dropdown",
          role: "button",
          "aria-expanded": "false",
        },
        div(
          {
            class: "h3 mb-0 bg-muted text-muted-fg",
            style:
              "border-radius: 50%; width: 40px; height:40px; display: flex;align-items: center; justify-content: center;",
          },
          user.email[0].toUpperCase()
        )
      ),
      ul(
        {
          class: ["dropdown-menu", ix === nitems - 1 && "dropdown-menu-end"],
        },
        item.subitems.map(subItem(currentUrl))
      )
    );
  }
  return li(
    {
      class: ["nav-item", is_active && "active", item.subitems && "dropdown"],
    },
    item.type === "Separator"
      ? hr({ class: "mx-3 my-1" })
      : item.type === "Search"
      ? form(
          {
            action: "/search",
            class: "menusearch ms-2",
            method: "get",
            autocomplete: "off",
            novalidate: "",
          },
          div(
            { class: "input-icon" },
            span({ class: "input-icon-addon" }, i({ class: "fas fa-search" })),
            input({
              type: "text",
              value: "",
              class: "form-control",
              placeholder: "Search…",
              "aria-label": "Search in website",
            })
          )
        )
      : item.subitems
      ? [
          a(
            {
              class: [
                "nav-link dropdown-toggle",
                is_active && !horiz && "show",
              ],
              href: "#",
              "data-bs-toggle": "dropdown",
              "data-bs-auto-close": "false",
              role: "button",
              "aria-expanded": "false",
            },
            //i({ class: "fas fa-fw fa-wrench" }),
            item.icon && item.icon !== "empty" && item.icon !== "undefined"
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
                ix === nitems - 1 && "dropdown-menu-end",
                is_active && !horiz && "show",
              ],
            },

            item.subitems.map(subItem(currentUrl))
          ),
        ]
      : item.link
      ? a(
          {
            class: [
              item.style && item.style.includes("btn") ? "ms-2" : "nav-link",
              item.style || "",
            ],
            href: text(item.link),
          },
          item.icon && item.icon !== "empty" && item.icon !== "undefined"
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

const sideBarSection = (currentUrl, config, user, horiz) => (section) =>
  [
    //section.section &&
    //  li({ class: "nav-header text-uppercase" }, section.section),
    section.items
      .map(sideBarItem(currentUrl, config, user, section.items.length, horiz))
      .join(""),
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

const showBrand = (brand, config) =>
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
    !config?.hide_site_name && brand.name
  );

const header_sections = (brand, sections, currentUrl, config, user, title) => {
  if (!sections && !brand) return "";
  const { primary, secondary } = splitPrimarySecondaryMenu(sections || []);

  switch (config?.layout_style) {
    case "Vertical":
      return vertical_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config,
        user
      );
    case "Condensed": {
      return condensed_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config,
        user
      );
    }
    case "Combined":
      return combined_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config,
        user,
        title
      );

    default: //Horizontal
      return horizontal_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config,
        user
      );
  }
};

const horizontal_header_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config,
  user
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
      brand && showBrand(brand, config),
      div(
        { class: "navbar-nav flex-row order-md-last" },
        secondary.map(sideBarSection(currentUrl, config, user, true))
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
            primary.map(sideBarSection(currentUrl, config, user, true))
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
  config,
  user,
  title
) =>
  aside(
    {
      class: [
        "navbar navbar-vertical navbar-expand-lg d-print-none",
        config.sidebar_background === "Transparent" && "navbar-transparent",
      ],
      "data-bs-theme":
        config.sidebar_background === "Dark" ? "dark" : undefined,
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
      brand && showBrand(brand, config),
      div(
        { class: "navbar-nav flex-row d-lg-none" },
        secondary.map(sideBarSection(currentUrl, config, user, true))
      ),
      div(
        { class: "collapse navbar-collapse", id: "sidebar-menu" },
        ul(
          { class: "navbar-nav pt-lg-3" },
          primary.map(sideBarSection(currentUrl, config, user))
        )
      )
    )
  ) +
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
      config.show_title &&
        div({ class: "navbar-nav flex-row pt-3 ps-1" }, h3(text(title))),
      div(
        { class: "navbar-nav flex-row order-md-last" },
        secondary.map(sideBarSection(currentUrl, config, user, true))
      ),
      div({ class: "collapse navbar-collapse", id: "navbar-menu" })
    )
  );

const condensed_header_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config,
  user
) =>
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
      brand && showBrand(brand, config),
      div(
        { class: "navbar-nav flex-row order-md-last" },
        secondary.map(sideBarSection(currentUrl, config, user, true))
      ),
      div(
        { class: "collapse navbar-collapse", id: "navbar-menu" },
        div(
          {
            class:
              "d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center",
          },
          ul(
            { class: "navbar-nav" },
            primary.map(sideBarSection(currentUrl, config, user, true))
          )
        )
      )
    )
  );
const vertical_header_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config,
  user
) =>
  aside(
    {
      class: [
        "navbar navbar-vertical navbar-expand-lg d-print-none",
        config.sidebar_background === "Transparent" && "navbar-transparent",
      ],
      "data-bs-theme":
        config.sidebar_background === "Dark" ? undefined : "dark",
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
      brand && showBrand(brand, config),
      div(
        { class: "navbar-nav flex-row d-lg-none" },
        secondary.map(sideBarSection(currentUrl, config, user, true))
      ),
      div(
        { class: "collapse navbar-collapse", id: "sidebar-menu" },
        ul(
          { class: "navbar-nav pt-lg-3" },
          [...primary, ...secondary].map(
            sideBarSection(currentUrl, config, user)
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
const renderBody = (title, body, role, config, alerts, req) =>
  renderLayout({
    blockDispatch,
    role,
    req,
    hints,
    alerts,
    layout: body,
  });
const wrapIt = (config, bodyAttr, headers, title, body) => `<!doctype html>
<html lang="en" data-bs-theme="${config?.mode || "light"}">
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <link rel="stylesheet" href="/plugins/public/tabler${verstring}/fontawesome/fontawesome.min.css" />
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
    <link rel="stylesheet" href="/plugins/public/tabler${verstring}/tabler.min.css">
    ${headersInHead(headers, config?.mode === "dark")}
    <title>${text(title)}</title>
    <style>
    @import url('https://rsms.me/inter/inter.css');
    :root {
      --tblr-font-sans-serif: 'Inter Var', -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif;
    }
    body {
      font-feature-settings: "cv03", "cv04", "cv11";
    }
    span.nav-link-icon i.fa-fw { margin-top: 0.4rem; }
    .badge.bg-secondary { color: white; }

  </style>
  </head>
  <body ${bodyAttr}>
  ${body}
  <script src="/static_assets/${
    db.connectObj.version_tag
  }/jquery-3.6.0.min.js"></script>
  <script src="/plugins/public/tabler${verstring}/popper.min.js"></script>
  <script src="/plugins/public/tabler${verstring}/tabler.min.js"></script>

    ${headersInBody(headers)}
    <style>
      .form-group { margin-bottom: 1rem; }
      .nav-link-icon { margin-top: -8px; margin-right: 3px; }
      ol.breadcrumb { margin-bottom: 0.5rem; }
      i.empty { display:none; }
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
    {}, //config unknown
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
    requestFluidLayout,
    req,
    bodyClass,
  }) =>
    wrapIt(
      config,
      `class="antialiased ${bodyClass || ""} ${
        config?.fluid || requestFluidLayout ? "layout-fluid" : ""
      }"`,
      headers,
      title,
      `<div id="page">
        ${header_sections(brand, menu, currentUrl, config, req?.user, title)}
        <div class="page-wrapper">
            <div class="container-xl pt-2 bg-${(
              config.content_background || "Transparent"
            ).toLowerCase()}" id="page-inner-content">
            ${renderBody(title, body, role, config, alerts, req)}
            </div>
        </div>
    </div>`
    );

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "settings",
        form: async () => {
          const userFields = Table.findOne("users").fields;

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
                name: "show_title",
                label: "Show title",
                sublabel: "Show title in header",
                type: "Bool",
                showIf: { layout_style: "Combined" },
              },
              {
                name: "sidebar_background",
                label: "Sidebar background",
                type: "String",
                attributes: { options: ["Dark", "White", "Transparent"] },
                required: true,
                showIf: { layout_style: ["Combined", "Vertical"] },
              },
              {
                name: "content_background",
                label: "Content background",
                type: "String",
                attributes: { options: ["Transparent", "Light", "White"] },
                required: true,
              },
              {
                name: "fluid",
                label: "Fluid",
                type: "Bool",
              },
              {
                name: "avatar_file",
                label: "Avatar field",
                sublabel:
                  "A File field on the user table with the user's image",
                type: "String",
                attributes: {
                  options: userFields.filter((f) => f.type === "File"),
                },
              },
              {
                name: "hide_site_name",
                label: "Hide site name from menu",
                type: "Bool",
              },
              {
                name: "mode",
                label: "Mode",
                type: "String",
                required: true,
                default: "light",
                attributes: {
                  options: [
                    { name: "light", label: "Light" },
                    { name: "dark", label: "Dark" },
                  ],
                },
              },
            ],
          });
        },
      },
    ],
  });

const userConfigForm = async (ctx) => {
  return new Form({
    fields: [
      {
        name: "mode",
        label: "Mode",
        type: "String",
        required: true,
        default: ctx.mode || "light",
        attributes: {
          options: [
            { name: "light", label: "Light" },
            { name: "dark", label: "Dark" },
          ],
        },
      },
    ],
  });
};

const layout = (config) => ({
  wrap: wrap(config),
  authWrap,
  hints,
  renderBody: ({ title, body, alerts, role, req }) =>
    renderBody(title, body, role, config, alerts, req),
});

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "tabler",
  configuration_workflow,
  user_config_form: userConfigForm,
  layout,
  actions: () => ({
    toggle_tabler_dark_mode: {
      description: "Switch between dark and light mode",
      configFields: [],
      run: async ({ user, req }) => {
        let plugin = await Plugin.findOne({ name: "tabler" });
        if (!plugin) {
          plugin = await Plugin.findOne({
            name: "@saltcorn/tabler",
          });
        }
        const dbUser = await User.findOne({ id: user.id });
        const attrs = dbUser._attributes || {};
        const userLayout = attrs.layout || {
          config: {},
        };
        userLayout.plugin = plugin.name;
        const currentMode = userLayout.config.mode
          ? userLayout.config.mode
          : plugin.configuration?.mode
          ? plugin.configuration.mode
          : "light";
        userLayout.config.mode = currentMode === "dark" ? "light" : "dark";
        userLayout.config.is_user_config = true;
        attrs.layout = userLayout;
        await dbUser.update({ _attributes: attrs });
        getState().processSend({
          refresh_plugin_cfg: plugin.name,
          tenant: db.getTenantSchema(),
        });
        getState().userLayouts[user.email] = layout({
          ...(plugin.configuration ? plugin.configuration : {}),
          ...userLayout.config,
        });
        await sleep(500); // Allow other workers to reload this plugin
        return { reload_page: true };
      },
    },
  }),
};

/* TODO

menu on mobile: 
-combined

*/
