import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{_ as i,a,d as o,g as s,m as c,s as l,u}from"./iframe-tMSnMkvh.js";import{n as d,t as f}from"./Stack-Blj2xom2.js";import{i as p,s as m}from"./transactionAmountInput-BaIP6MYU.js";import{_ as h,m as g}from"./transactions-Dcq0gS9C.js";import{n as _,t as v}from"./Box-DsmDzh81.js";import{n as y,t as b}from"./Typography-CWKirwdW.js";import{i as x,t as ee}from"./transactionMessages-_ahuTlkF.js";import{n as S,t as C}from"./Button-DJTTRrLP.js";import{n as w,t as te}from"./link-Du4AGLbo.js";import{n as ne,t as re}from"./PrimaryActionButton-DiFVNaV1.js";import{a as ie,c as ae,i as oe}from"./OperationFeedbackDialogs-D8L_ZqwA.js";import{n as se,t as ce}from"./IconButton-C_ZkoDI7.js";import{n as le,o as ue,s as de,t as fe}from"./DialogContent-OelRDb8v.js";import{n as pe,t as me}from"./DialogActions-BOHXclwd.js";import{n as he,t as ge}from"./DialogTitle-B7TScYrs.js";import{n as _e,t as ve}from"./bottomNavigationLayout-DPVhbNA0.js";import{E as ye,T,t as be}from"./transaction-eoyBMnZ9.js";import{n as xe,t as Se}from"./TransactionTypeNavigation-w5vYRpDx.js";import{r as Ce,t as we}from"./userThemeCardSx-vnoApgu-.js";import{n as Te,t as Ee}from"./DialogContentText-CvPgR_43.js";import{n as De,r as Oe}from"./ErrorState-F7HgUABz.js";import{n as ke,t as Ae}from"./ArrowBackRounded-CpnRt5D2.js";import{n as je,t as Me}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as Ne,t as Pe}from"./LinkedTransactionSyncConfirmationDialog-B-d6W16O.js";import{n as Fe,t as Ie}from"./TransactionAmountKeypadLauncher-CNlMPIEj.js";import{o as Le,r as Re,t as ze}from"./TransactionForm.styles-_NNCSziJ.js";import{n as Be,t as E}from"./TransactionForm-ChFbI76C.js";import{n as Ve,t as He}from"./EditTransactionDirtyContext-CaDsW0-5.js";import{n as Ue,t as D}from"./TransferTransactionForm-Zj3gP7GH.js";function We(e){let t=new FormData;for(let[n,r]of e.entries())t.append(n,r);return t}function Ge(e){let t=(0,O.useRef)(null),[n,r]=(0,O.useState)(null),[i,a,o]=(0,O.useActionState)((0,O.useCallback)(async(n,r)=>{let i=await e(n,r);return i.errorCode===T.linkedSyncConfirmationRequired&&(t.current=We(r)),i},[e]),{}),s=!!(i!==n&&i.error&&i.errorCode===T.linkedSyncConfirmationRequired),c=!!(i!==n&&i.error&&i.errorCode!==T.linkedSyncConfirmationRequired);function l(){t.current=null,r(i)}function u(){let e=t.current;e&&(e.set(`confirmSync`,`true`),t.current=null,r(i),(0,O.startTransition)(()=>a(e)))}return{cancelConfirmation:l,closeFailure:()=>r(i),confirmSync:u,formAction:a,isConfirmationOpen:s,isFailureOpen:c,isPending:o,state:i}}var O,Ke=t((()=>{O=e(n()),be()}));function k(e){return`edit-${e}-transaction-form`}function A(e){if(!e)throw Error(`transactionRecordId is required for edit transaction.`);return e}function qe({activeType:e,panels:t}){let n=(0,F.useRef)(null),r=(0,F.useRef)(null),i=(0,F.useRef)(null),[a,o]=(0,F.useState)(null),s=at.indexOf(e);return(0,F.useLayoutEffect)(()=>{function t(){return e===`expense`?n.current:e===`income`?r.current:i.current}let a=t();if(!a)return;function s(){let e=t();e&&o(e.getBoundingClientRect().height)}if(s(),typeof ResizeObserver>`u`)return;let c=new ResizeObserver(s);return c.observe(a),()=>{c.disconnect()}},[e]),(0,P.jsx)(_,{"data-testid":`transaction-type-slide-panels`,sx:e=>({height:a??`auto`,overflow:`hidden`,transition:e.transitions.create(`height`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:(0,P.jsx)(_,{sx:e=>({alignItems:`flex-start`,display:`flex`,transform:`translateX(-${s*100}%)`,transition:e.transitions.create(`transform`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:at.map(a=>(0,P.jsx)(_,{ref:a===`expense`?n:a===`income`?r:i,"aria-hidden":a!==e,"data-testid":`transaction-type-slide-panel-${a}`,inert:a===e?void 0:!0,sx:{flex:`0 0 100%`},children:t[a]},a))})})}function Je(e){return(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(Xe,{...e}),(0,P.jsx)(Ie,{})]})}function j({deleteControl:e,operation:t,reason:n=`permission`}){let r=t===`create`?`新增`:`编辑`,i=t===`edit`&&n!==`permission`?x[n]:null;return(0,P.jsxs)(d,{spacing:2,children:[(0,P.jsx)(M,{title:`${r}记账`}),(0,P.jsx)(De,{title:i?x.title:`无法${r}记账`,description:i??`当前账本角色没有${r}记账的权限。`,action:(0,P.jsxs)(d,{direction:`row`,spacing:1.5,children:[(0,P.jsx)(S,{component:w,href:o.transactions,variant:`outlined`,children:`返回明细`}),e?(0,P.jsx)(Qe,{...e}):null]})})]})}function Ye(e){let t=c(e);return{account:a(t),merchant:u(t)}}function Xe({accountOptions:e,action:t,categoryOptions:n,errorMessage:r,frequentCategoryIds:i,initialType:o,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,transactionItemSpecialStatusEnabled:m}){let[h,g]=(0,F.useActionState)(t,{}),_=h.error??r,[v,y]=(0,F.useState)(o??`expense`),b=(0,F.useRef)(o===`income`?`income`:`expense`),[,x]=(0,F.useState)({expense:!0,income:!0,transfer:!0});(0,F.useEffect)(()=>{v!==`transfer`&&(b.current=v)},[v]);function ee(e){if(e===`normal`){y(b.current);return}y(`transfer`)}let S=(0,F.useMemo)(()=>({expense:(0,P.jsx)(E,{action:g,accountOptions:e,categoryOptions:n,errorMessage:_,frequentCategoryIds:i,formId:`new-expense-transaction-form`,hideHeader:!0,initialType:`expense`,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,setupHrefs:Ye(`expense`),transactionItemSpecialStatusEnabled:m,onSubmitDisabledChange:e=>x(t=>({...t,expense:e}))}),income:(0,P.jsx)(E,{action:g,accountOptions:e,categoryOptions:n,errorMessage:_,frequentCategoryIds:i,formId:`new-income-transaction-form`,hideHeader:!0,initialType:`income`,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,setupHrefs:Ye(`income`),transactionItemSpecialStatusEnabled:m,onSubmitDisabledChange:e=>x(t=>({...t,income:e}))}),transfer:(0,P.jsx)(D,{action:g,accountOptions:e,addAccountHref:a(c(`transfer`)),errorMessage:_,formId:`new-transfer-transaction-form`,hideHeader:!0,onSubmitDisabledChange:e=>x(t=>({...t,transfer:e}))})}),[g,e,n,i,_,s,l,u,f,p,m]);return(0,P.jsxs)(d,{spacing:0,children:[(0,P.jsx)(M,{title:`记一笔`}),(0,P.jsx)(Se,{activeType:v===`transfer`?`transfer`:`normal`,onChange:ee}),(0,P.jsx)(qe,{activeType:v,panels:S})]})}function M({hasUnsavedChanges:e=!1,onClose:t,title:n}){return(0,P.jsxs)(_,{sx:st,children:[e&&t?(0,P.jsx)(se,{"aria-label":`关闭`,onClick:t,sx:ct,children:(0,P.jsx)(Ae,{})}):(0,P.jsx)(se,{"aria-label":`关闭`,component:w,href:o.transactions,sx:ct,children:(0,P.jsx)(Ae,{})}),(0,P.jsx)(y,{component:`h1`,variant:`h5`,sx:lt,children:n}),(0,P.jsx)(_,{"aria-hidden":!0,sx:{width:40}})]})}function Ze({activeType:e,deleteAction:t,hasLinkedIncomeItems:n,isSaveConfirmationOpen:r,isSaveFailureOpen:i,isSavePending:a,onCancelSync:s,onCloseSaveFailure:c,onConfirmSync:l,panels:u,saveErrorMessage:f,setActiveType:p,submitDisabledByType:m,transactionRecordId:h}){let[g,v]=(0,F.useState)(!1),[y,b]=(0,F.useState)(!1),x=(0,F.useRef)(e===`transfer`?`expense`:e),ee=e===`transfer`?`transfer`:`normal`,C=(0,F.useCallback)(()=>v(!0),[]);(0,F.useEffect)(()=>{e!==`transfer`&&(x.current=e)},[e]),(0,F.useEffect)(()=>{if(!g)return;function e(e){e.preventDefault(),e.returnValue=``}return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[g]);function te(e){C(),p(e===`transfer`?`transfer`:x.current)}function ne(){let t=document.getElementById(k(e))?.closest(`form`);t instanceof HTMLFormElement&&(b(!1),t.requestSubmit())}return(0,P.jsxs)(He,{onDirty:C,children:[(0,P.jsxs)(d,{onChangeCapture:C,spacing:0,children:[(0,P.jsx)(M,{hasUnsavedChanges:g,onClose:()=>b(!0),title:`编辑记账`}),(0,P.jsx)(Se,{activeType:ee,onChange:te}),(0,P.jsx)(qe,{activeType:e,panels:u}),(0,P.jsxs)(_,{sx:ut,children:[(0,P.jsx)(Qe,{buttonSx:ft,deleteAction:t,hasLinkedIncomeItems:n,size:`large`,transactionRecordId:h}),(0,P.jsx)(re,{disabled:m[e]||a,form:k(e),size:`large`,type:`submit`,sx:dt,children:`保存修改`})]})]}),(0,P.jsx)(Ie,{}),(0,P.jsxs)(de,{"aria-labelledby":`unsaved-transaction-dialog-title`,onClose:()=>b(!1),open:y,children:[(0,P.jsx)(he,{id:`unsaved-transaction-dialog-title`,children:`尚未保存`}),(0,P.jsx)(le,{children:(0,P.jsx)(Te,{children:`修正的内容尚未保存，是否保存？`})}),(0,P.jsxs)(pe,{children:[(0,P.jsx)(S,{onClick:()=>b(!1),children:`继续编辑`}),(0,P.jsx)(S,{component:w,href:o.transactions,color:`error`,children:`放弃修改`}),(0,P.jsx)(S,{onClick:ne,variant:`contained`,children:`保存`})]})]}),(0,P.jsx)(Pe,{onCancel:()=>{v(!0),s()},onConfirm:l,open:r}),(0,P.jsx)(ie,{bottomOffset:ve.feedbackBottomOffset,description:f,onClose:()=>{v(!0),c()},open:i,title:`保存失败`})]})}function Qe({buttonSx:e,deleteAction:t,hasLinkedIncomeItems:n,size:r,transactionRecordId:i}){let[a,o]=(0,F.useActionState)(t,{}),[s,c]=(0,F.useState)(!1),[l,u]=(0,F.useState)(a);function d(){let e=document.getElementById(ot);e instanceof HTMLFormElement&&(c(!1),e.requestSubmit())}return(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(S,{color:`error`,onClick:()=>c(!0),size:r,variant:`outlined`,sx:e,children:`删除`}),(0,P.jsx)(`form`,{action:o,hidden:!0,id:ot,children:(0,P.jsx)(`input`,{name:`transactionRecordId`,readOnly:!0,type:`hidden`,value:i})}),(0,P.jsx)(oe,{description:n?`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`:`删除后这笔记账会从明细页移除，是否继续？`,onCancel:()=>c(!1),onConfirm:d,open:s,title:`删除记账？`}),(0,P.jsx)(ie,{bottomOffset:ve.feedbackBottomOffset,description:a.error,onClose:()=>u(a),open:!!(a.error&&a!==l),title:a.errorCode===T.linkedDeleteForbidden?ye.deleteForbidden:`删除失败`})]})}function $e({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Ge(t),u=i,[d,f]=(0,F.useState)(`transfer`),[p,m]=(0,F.useState)({expense:!0,income:!0,transfer:!0}),h=(0,F.useMemo)(()=>({expense:(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(`input`,{form:k(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,P.jsx)(E,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:k(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:nt(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(`input`,{form:k(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,P.jsx)(E,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:k(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:nt(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,P.jsx)(D,{action:l.formAction,accountOptions:e,errorMessage:u,formId:k(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:o,onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:`transfer`})}),[l.formAction,e,n,a,u,o,s,c]);return(0,P.jsx)(Ze,{activeType:d,deleteAction:r,hasLinkedIncomeItems:!1,isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:A(o.transactionRecordId)})}function N({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Ge(t),u=i,[d,f]=(0,F.useState)(o.type),[p,m]=(0,F.useState)({expense:!0,income:!0,transfer:!0}),h=(0,F.useMemo)(()=>({expense:(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(`input`,{form:k(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,P.jsx)(E,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:k(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:et(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(`input`,{form:k(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,P.jsx)(E,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:k(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:et(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,P.jsx)(D,{action:l.formAction,accountOptions:e,errorMessage:u,formId:k(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:tt(o,e),onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:o.type})}),[l.formAction,e,n,a,u,o,s,c]);return(0,P.jsx)(Ze,{activeType:d,deleteAction:r,hasLinkedIncomeItems:g(o.items),isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:A(o.transactionRecordId)})}function et(e,t){return t===e.type?e:{...e,items:[],type:t}}function tt(e,t){return{accountId:e.accountId,note:e.note,transactionAt:e.transactionAt,transactionRecordId:A(e.transactionRecordId),transferAmount:rt(e.items,t.find(t=>t.id===e.accountId)?.currency),transferTargetAccountId:it(t,e.accountId),type:`transfer`}}function nt(e,t){return{accountId:e.accountId,items:[],merchantId:``,note:e.note,transactionAt:e.transactionAt,transactionRecordId:e.transactionRecordId,type:t}}function rt(e,t){let n=e.reduce((e,t)=>{let n=Number(t.amount);return Number.isFinite(n)?e+n:e},0);return n<=0?``:String(Number(n.toFixed(p(t))))}function it(e,t){let n=e.find(e=>e.id===t);return e.find(e=>e.id!==t&&e.currency===n?.currency)?.id??``}var P,F,at,ot,st,ct,lt,ut,dt,ft,pt=t((()=>{P=r(),F=e(n()),ke(),v(),C(),ue(),me(),fe(),Ee(),ge(),ce(),f(),b(),te(),ne(),l(),m(),ee(),h(),ae(),Oe(),_e(),be(),xe(),Fe(),Ve(),Ne(),Be(),ze(),Ue(),i(),Ke(),at=[`expense`,`income`,`transfer`],ot=`delete-transaction-form`,st={alignItems:`center`,display:`grid`,gridTemplateColumns:`40px minmax(0, 1fr) 40px`,pb:1.5,pt:{xs:0,sm:.5}},ct={"@media (hover: hover)":{"&:hover":{bgcolor:`action.hover`}},color:`text.secondary`,justifySelf:`start`},lt={color:`text.primary`,fontSize:`1rem`,fontWeight:800,letterSpacing:0,lineHeight:1.25,textAlign:`center`},ut={display:`grid`,gap:1.25,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 2fr)`,mt:Re.gap},dt={...Le,mt:0},ft={borderRadius:`${s.radius.md}px`,fontSize:`1rem`,fontWeight:800,minHeight:48},Je.__docgenInfo={description:``,methods:[],displayName:`NewTransactionTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},errorMessage:{required:!0,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``},frequentCategoryIds:{required:!0,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialType:{required:!1,tsType:{name:`TransactionRecordType`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionMerchantOption`}],raw:`TransactionMerchantOption[]`},description:``},refundPickerView:{required:!1,tsType:{name:`TransactionTimeGroupViewData`},description:``},loadRefundGroupItemsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  groupKey: string,
  offset: number,
) => Promise<TransactionMonthPage>`,signature:{arguments:[{type:{name:`string`},name:`groupKey`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionMonthPage`}],raw:`Promise<TransactionMonthPage>`}}},description:``},loadRefundMoreGroupsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  offset: number,
) => Promise<TransactionGroupPage>`,signature:{arguments:[{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionGroupPage`}],raw:`Promise<TransactionGroupPage>`}}},description:``},loadRefundSearchPageAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  query: string,
  offset: number,
) => Promise<TransactionSearchPage>`,signature:{arguments:[{type:{name:`string`},name:`query`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionSearchPage`}],raw:`Promise<TransactionSearchPage>`}}},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}},j.__docgenInfo={description:``,methods:[],displayName:`TransactionPermissionDenied`,props:{deleteControl:{required:!1,tsType:{name:`signature`,type:`object`,raw:`{
  deleteAction: TransactionStateAction;
  hasLinkedIncomeItems: boolean;
  transactionRecordId: string;
}`,signature:{properties:[{key:`deleteAction`,value:{name:`TransactionStateAction`,required:!0}},{key:`hasLinkedIncomeItems`,value:{name:`boolean`,required:!0}},{key:`transactionRecordId`,value:{name:`string`,required:!0}}]}},description:`不能编辑但可以删除时（如多账户记录）给出删除入口。`},operation:{required:!0,tsType:{name:`union`,raw:`"edit" | "create"`,elements:[{name:`literal`,value:`"edit"`},{name:`literal`,value:`"create"`}]},description:``},reason:{required:!1,tsType:{name:`union`,raw:`"archivedAccount" | "linked" | "multiAccount" | "permission"`,elements:[{name:`literal`,value:`"archivedAccount"`},{name:`literal`,value:`"linked"`},{name:`literal`,value:`"multiAccount"`},{name:`literal`,value:`"permission"`}]},description:``,defaultValue:{value:`"permission"`,computed:!1}}}},$e.__docgenInfo={description:``,methods:[],displayName:`EditTransferTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransferEditInitialValues`},description:``}}},N.__docgenInfo={description:``,methods:[],displayName:`EditTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``}}}}));function mt({children:e}){return(0,ht.jsx)(_,{"data-testid":`transaction-page-frame`,sx:gt,children:e})}var ht,gt,_t=t((()=>{ht=r(),v(),je(),i(),we(),gt={color:`text.primary`,display:`flex`,flexDirection:`column`,isolation:`isolate`,marginInline:`auto`,maxWidth:480,minWidth:0,position:`relative`,px:{xs:1.5,sm:2},pb:{xs:2,sm:3},pt:{xs:1,sm:1.5},width:`100%`,"&::before":{...Me,content:`""`},"& .MuiToggleButtonGroup-root":{bgcolor:`var(--user-theme-segment-bg)`,border:0,borderRadius:`${s.radius.lg}px`,boxShadow:`none`,gap:0,mb:2,p:.375},"& .MuiToggleButton-root":{border:0,borderRadius:`${s.radius.md}px`,color:`var(--user-theme-segment-text)`,fontSize:`0.875rem`,fontWeight:800,minHeight:34,py:.5},"& .MuiToggleButton-root.Mui-selected":{background:`var(--user-theme-fab-bg)`,boxShadow:`var(--user-theme-card-shadow)`,color:`var(--user-theme-fab-text) !important`},"@media (hover: hover)":{"& .MuiToggleButton-root.Mui-selected:hover":{background:`var(--user-theme-fab-bg)`}},"& .MuiPaper-outlined":{bgcolor:`var(--user-theme-card-bg)`,...Ce,borderRadius:`${s.radius.lg}px`,boxShadow:`none`},"& .MuiTextField-root .MuiOutlinedInput-root":{bgcolor:`var(--user-theme-card-bg)`,borderRadius:`${s.radius.md}px`},"& .MuiTextField-root .MuiInputLabel-root":{color:`text.secondary`,fontWeight:700},"& .MuiButton-outlined":{borderColor:`var(--user-theme-field-card-selected-border)`,borderRadius:`${s.radius.md}px`,color:`var(--user-theme-action-text)`,fontWeight:800},"& .MuiButton-contained:not(.Mui-disabled)":{background:`var(--user-theme-fab-bg)`,boxShadow:`0 8px 18px var(--user-theme-fab-shadow)`,color:`var(--user-theme-fab-text)`}},mt.__docgenInfo={description:``,methods:[],displayName:`NewTransactionVisualFrame`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}}}));async function I(){return{}}var L,R,z,vt,B,yt,V,bt,H,U,W,G,K,q,J,Y,X,Z,Q,$,xt;t((()=>{L=r(),be(),pt(),_t(),{userEvent:R,within:z}=__STORYBOOK_MODULE_TEST__,vt=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],B=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`固定收入`,type:`income`}],yt=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`共達`,icon_url:null}],V={accountOptions:vt,action:I,categoryOptions:B,errorMessage:null,frequentCategoryIds:B.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:yt,transactionItemSpecialStatusEnabled:!0},bt={title:`Templates/Transactions/TransactionFormPage`,component:Je,decorators:[e=>(0,L.jsx)(mt,{children:(0,L.jsx)(e,{})})],args:V},H={name:`新增记账页面`},U={name:`含错误提示`,args:{errorMessage:`新增记账失败。请稍后重试。`}},W={name:`无新增权限`,render:()=>(0,L.jsx)(j,{operation:`create`})},G={name:`转账账户已归档`,render:()=>(0,L.jsx)(j,{operation:`edit`,reason:`archivedAccount`})},K={name:`多账户记录只读（可删除）`,render:()=>(0,L.jsx)(j,{deleteControl:{deleteAction:async()=>({}),hasLinkedIncomeItems:!1,transactionRecordId:`00000000-0000-4000-8000-000000009140`},operation:`edit`,reason:`multiAccount`})},q={name:`无账户和分类选项`,args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},J={name:`编辑支出：可切换到转账`,render:()=>(0,L.jsx)(N,{...V,deleteAction:I,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`普通交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`}})},Y={name:`编辑收入：可切换到转账`,render:()=>(0,L.jsx)(N,{...V,deleteAction:I,initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`260000`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`收入交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`}})},X={name:`编辑记账：转账类型可切换到支出或收入`,render:()=>(0,L.jsx)($e,{...V,deleteAction:I,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,note:`转账编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transferAmount:`5000`,transferTargetAccountId:`00000000-0000-4000-8000-000000000046`,type:`transfer`}})},Z={name:`编辑已关联支出：可编辑并显示核销结余`,render:()=>(0,L.jsx)(N,{...V,deleteAction:I,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessNetAmount:`-300`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1500`},settlementStatus:`reimbursementSurplus`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursementSurplus`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`已有关联但仍可修正`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`}})},Q={name:`删除仍被子项关联的母项被拒绝`,render:()=>(0,L.jsx)(N,{...V,deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:T.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursed`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除前需要解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009005`,type:`expense`}}),play:async({canvasElement:e})=>{let t=z(e);await R.click(await t.findByRole(`button`,{name:`删除`})),await R.click(await z(document.body).findByRole(`button`,{name:`删除`})),await z(document.body).findByText(`无法删除已关联明细`)}},$={name:`删除关联收入时提示自动解除关联`,render:()=>(0,L.jsx)(N,{...V,deleteAction:I,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},categoryId:`00000000-0000-4000-8000-000000005073`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008002`,specialStatus:null}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除时自动解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009006`,type:`income`}}),play:async({canvasElement:e})=>{let t=z(e);await R.click(await t.findByRole(`button`,{name:`删除`})),await z(document.body).findByText(`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`)}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "新增记账页面"
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "含错误提示",
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "无新增权限",
  render: () => <TransactionPermissionDenied operation="create" />
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "转账账户已归档",
  render: () => <TransactionPermissionDenied operation="edit" reason="archivedAccount" />
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "多账户记录只读（可删除）",
  render: () => <TransactionPermissionDenied deleteControl={{
    deleteAction: async () => ({}),
    hasLinkedIncomeItems: false,
    transactionRecordId: "00000000-0000-4000-8000-000000009140"
  }} operation="edit" reason="multiAccount" />
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "无账户和分类选项",
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "编辑支出：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      categoryId: "00000000-0000-4000-8000-000000005072"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "普通交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009001",
    type: "expense"
  }} />
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "编辑收入：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000046",
    items: [{
      amount: "260000",
      categoryId: "00000000-0000-4000-8000-000000005073"
    }],
    merchantId: "00000000-0000-4000-8000-000000001002",
    note: "收入交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009002",
    type: "income"
  }} />
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "编辑记账：转账类型可切换到支出或收入",
  render: () => <EditTransferTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    note: "转账编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009003",
    transferAmount: "5000",
    transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
    type: "transfer"
  }} />
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "编辑已关联支出：可编辑并显示核销结余",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessNetAmount: "-300",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1500"
        },
        settlementStatus: "reimbursementSurplus"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursementSurplus"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "已有关联但仍可修正",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009004",
    type: "expense"
  }} />
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "删除仍被子项关联的母项被拒绝",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={async () => ({
    error: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
    errorCode: transactionErrorCodes.linkedDeleteForbidden,
    errorKey: "storybook-linked-delete-forbidden"
  })} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1200"
        },
        settlementStatus: "reimbursed"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursed"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除前需要解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009005",
    type: "expense"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("无法删除已关联明细");
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: "删除关联收入时提示自动解除关联",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: "reimbursement",
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "0"
        },
        settlementStatus: null
      },
      categoryId: "00000000-0000-4000-8000-000000005073",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008002",
      specialStatus: null
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除时自动解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009006",
    type: "income"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？");
  }
}`,...$.parameters?.docs?.source}}},xt=[`Default`,`WithError`,`PermissionDenied`,`ArchivedAccountPermissionDenied`,`MultiAccountPermissionDenied`,`EmptyOptions`,`EditExpenseConvert`,`EditIncomeConvert`,`EditTransferConvert`,`EditLinkedExpense`,`LinkedDeleteForbidden`,`LinkedIncomeDeleteConfirmation`]}))();export{G as ArchivedAccountPermissionDenied,H as Default,J as EditExpenseConvert,Y as EditIncomeConvert,Z as EditLinkedExpense,X as EditTransferConvert,q as EmptyOptions,Q as LinkedDeleteForbidden,$ as LinkedIncomeDeleteConfirmation,K as MultiAccountPermissionDenied,W as PermissionDenied,U as WithError,xt as __namedExportsOrder,bt as default};