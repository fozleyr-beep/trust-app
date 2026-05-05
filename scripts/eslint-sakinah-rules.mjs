const sageHex = /#8a9a7b/i;
const brassHex = /#a88547/i;

function jsxName(name) {
  if (!name) return "";
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") {
    return `${jsxName(name.object)}.${jsxName(name.property)}`;
  }
  return "";
}

function hasJsxProp(node, propName) {
  return node.attributes.some(
    (attr) =>
      attr.type === "JSXAttribute" &&
      attr.name.type === "JSXIdentifier" &&
      attr.name.name === propName,
  );
}

function textValue(node) {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateElement") return node.value.raw;
  if (node.type === "JSXText") return node.value;
  return "";
}

function rawColorRule(pattern, message, allowMarketing = false) {
  return {
    meta: {
      type: "problem",
      docs: { description: message },
      schema: [],
    },
    create(context) {
      function check(node) {
        const value = textValue(node);
        if (!pattern.test(value)) return;
        const filename = context.getFilename();
        if (allowMarketing && filename.includes("/app/(marketing)/")) return;
        context.report({ node, message });
      }

      return {
        Literal: check,
        TemplateElement: check,
        JSXText: check,
      };
    },
  };
}

const sakinahPlugin = {
  rules: {
    "no-verified-component": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Use named agent/action/timestamp trust state instead of a generic Verified component.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (jsxName(node.name) === "Verified") {
              context.report({
                node,
                message:
                  "Do not render a generic <Verified /> badge; use named agent trust state.",
              });
            }
          },
        };
      },
    },
    "trust-chip-contract": {
      meta: {
        type: "problem",
        docs: {
          description: "TrustChip must name the agent, action, and timestamp.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (jsxName(node.name) !== "TrustChip") return;
            for (const prop of ["agent", "action", "timestamp"]) {
              if (!hasJsxProp(node, prop)) {
                context.report({
                  node,
                  message: `TrustChip is missing required ${prop} prop.`,
                });
              }
            }
          },
        };
      },
    },
    "no-raw-sage": rawColorRule(
      sageHex,
      "Use the trust token instead of raw sage hex.",
    ),
    "no-raw-brass": rawColorRule(
      brassHex,
      "Brass is reserved for marketing thread surfaces.",
      true,
    ),
  },
};

export default sakinahPlugin;
