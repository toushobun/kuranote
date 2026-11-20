import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{F as n,I as r,g as i,h as a}from"./iframe-Km2r3jlv.js";import{n as o,t as s}from"./Stack-CedAN9w3.js";import{n as c,t as l}from"./PrimaryActionButton-D-ssINwe.js";function u({next:e,previous:t}){let n=e.loading??!1,i=e.loadingLabel??e.label;return(0,d.jsxs)(o,{direction:`row`,spacing:1.5,sx:f,children:[t?(0,d.jsx)(r,{disabled:t.disabled,fullWidth:!0,onClick:t.onClick,sx:p,type:`button`,variant:`outlined`,children:t.label}):null,(0,d.jsx)(l,{disabled:e.disabled,pending:n,pendingLabel:i,form:e.form,fullWidth:!0,onClick:e.onClick,type:e.type??`button`,children:e.label})]})}var d,f,p,m=e((()=>{d=t(),n(),s(),c(),i(),f={bgcolor:`background.paper`,borderTop:`1px solid`,borderColor:`divider`,pb:`calc(12px + env(safe-area-inset-bottom))`,pt:1.2,px:{xs:2,sm:3}},p={borderColor:`var(--user-theme-action-text)`,borderRadius:`${a.radius.full}px`,color:`text.secondary`,fontWeight:900,minHeight:48},u.__docgenInfo={description:`分步骤流程底部固定操作栏。按钮组合、文字与 loading / disabled 状态由各步骤通过 props 控制。`,methods:[],displayName:`WizardActionBar`,props:{next:{required:!0,tsType:{name:`signature`,type:`object`,raw:`{
  disabled?: boolean;
  /** 关联的 form 元素 ID。按钮在 form 外部时用于提交该表单。 */
  form?: string;
  label: string;
  /** 处理中：通过共用按钮零件展示并防连点。 */
  loading?: boolean;
  /** 处理中时按钮的无障碍名称。 */
  loadingLabel?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}`,signature:{properties:[{key:`disabled`,value:{name:`boolean`,required:!1}},{key:`form`,value:{name:`string`,required:!1},description:`关联的 form 元素 ID。按钮在 form 外部时用于提交该表单。`},{key:`label`,value:{name:`string`,required:!0}},{key:`loading`,value:{name:`boolean`,required:!1},description:`处理中：通过共用按钮零件展示并防连点。`},{key:`loadingLabel`,value:{name:`string`,required:!1},description:`处理中时按钮的无障碍名称。`},{key:`onClick`,value:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}},required:!1}},{key:`type`,value:{name:`union`,raw:`"button" | "submit"`,elements:[{name:`literal`,value:`"button"`},{name:`literal`,value:`"submit"`}],required:!1}}]}},description:``},previous:{required:!1,tsType:{name:`signature`,type:`object`,raw:`{
  disabled?: boolean;
  label: string;
  onClick: () => void;
}`,signature:{properties:[{key:`disabled`,value:{name:`boolean`,required:!1}},{key:`label`,value:{name:`string`,required:!0}},{key:`onClick`,value:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}},required:!0}}]}},description:`「上一步」描边胶囊按钮；省略时「下一步」占满宽度。`}}}}));export{m as n,u as t};