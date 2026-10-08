import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./iframe-BTw7w_8M.js";import{n as i,t as a}from"./Stack-Blj2xom2.js";import{n as o,t as s}from"./CircularProgress-CIp3Gv75.js";import{n as c,t as l}from"./Button-DJTTRrLP.js";import{n as u,t as d}from"./PrimaryActionButton-B7-QaqSs.js";function f({next:e,previous:t,skip:n}){let r=e.loading??!1,a=e.loadingLabel??e.label;return(0,p.jsxs)(i,{spacing:.75,sx:m,children:[n?(0,p.jsx)(c,{disabled:n.disabled,onClick:n.onClick,sx:h,type:`button`,variant:`text`,children:n.label}):null,(0,p.jsxs)(i,{direction:`row`,spacing:1.5,children:[t?(0,p.jsx)(c,{disabled:t.disabled,fullWidth:!0,onClick:t.onClick,sx:g,type:`button`,variant:`outlined`,children:t.label}):null,(0,p.jsx)(d,{"aria-label":r?a:void 0,disabled:e.disabled||r,form:e.form,fullWidth:!0,onClick:e.onClick,type:e.type??`button`,children:r?(0,p.jsx)(o,{"aria-label":a,color:`inherit`,size:22}):e.label})]})]})}var p,m,h,g,_=e((()=>{p=t(),l(),s(),a(),u(),n(),m={bgcolor:`background.paper`,borderColor:`divider`,borderTop:`1px solid`,pb:`calc(12px + env(safe-area-inset-bottom))`,pt:1.2,px:{xs:2,sm:3}},h={alignSelf:`center`,color:`text.secondary`,fontWeight:700,minHeight:40},g={borderColor:`var(--user-theme-action-text)`,borderRadius:`${r.radius.full}px`,color:`text.secondary`,fontWeight:900,minHeight:48},f.__docgenInfo={description:`分步骤流程底部固定操作栏。按钮组合、文字与 loading / disabled 状态由各步骤通过 props 控制。`,methods:[],displayName:`WizardActionBar`,props:{next:{required:!0,tsType:{name:`signature`,type:`object`,raw:`{
  disabled?: boolean;
  /** 关联的 form 元素 ID。按钮在 form 外部时用于提交该表单。 */
  form?: string;
  label: string;
  /** 处理中：显示 CircularProgress 并禁用按钮。 */
  loading?: boolean;
  /** 处理中时 CircularProgress 的无障碍名称。 */
  loadingLabel?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}`,signature:{properties:[{key:`disabled`,value:{name:`boolean`,required:!1}},{key:`form`,value:{name:`string`,required:!1},description:`关联的 form 元素 ID。按钮在 form 外部时用于提交该表单。`},{key:`label`,value:{name:`string`,required:!0}},{key:`loading`,value:{name:`boolean`,required:!1},description:`处理中：显示 CircularProgress 并禁用按钮。`},{key:`loadingLabel`,value:{name:`string`,required:!1},description:`处理中时 CircularProgress 的无障碍名称。`},{key:`onClick`,value:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}},required:!1}},{key:`type`,value:{name:`union`,raw:`"button" | "submit"`,elements:[{name:`literal`,value:`"button"`},{name:`literal`,value:`"submit"`}],required:!1}}]}},description:``},previous:{required:!1,tsType:{name:`signature`,type:`object`,raw:`{
  disabled?: boolean;
  label: string;
  onClick: () => void;
}`,signature:{properties:[{key:`disabled`,value:{name:`boolean`,required:!1}},{key:`label`,value:{name:`string`,required:!0}},{key:`onClick`,value:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}},required:!0}}]}},description:`「上一步」描边胶囊按钮；省略时「下一步」占满宽度。`},skip:{required:!1,tsType:{name:`signature`,type:`object`,raw:`{
  disabled?: boolean;
  label: string;
  onClick: () => void;
}`,signature:{properties:[{key:`disabled`,value:{name:`boolean`,required:!1}},{key:`label`,value:{name:`string`,required:!0}},{key:`onClick`,value:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}},required:!0}}]}},description:`位于操作栏上方的「跳过此步」文字按钮。`}}}}));export{_ as n,f as t};