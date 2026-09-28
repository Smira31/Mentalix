var Ss=Object.defineProperty;var r=(s,a)=>Ss(s,"name",{value:a,configurable:!0});import{j as e,r as o}from"./query-oguEvgfB.js";import{D as Es,a as Ms,T as is,u as ns,h as Ps,F as As,g as ls,p as T,m as Ls,r as Rs,t as cs,b as Is,B as Ts,s as Ds,c as zs,d as os,P as $s,e as le,f as Os,i as Bs,j as Hs,k as Us}from"./index-CMNQFMxd.js";import{S as w,s as Fs}from"./SemanticGlyph-druIJCNb.js";import{e as _e,A as E,F as Gs,U as Vs,X as Ce,P as F,f as G,R as O,a as K,g as R,h as Zs,i as ds,j as Xs,k as ke,l as Ws,m as qs,M as Ks,H as ms,n as xs,o as hs,B as ps,p as us,C as Js}from"./icons-CLOctzes.js";import Ys from"./ThemeScreen-DxSKEr6m.js";import{r as bs}from"./charts-D_S_ZOKX.js";import{P as Qs}from"./PracticeWritingCanvas-q16nAw6W.js";import{J as Se}from"./LayeredPracticeCatalogExperiment-Dl9wT1IC.js";import{S as ea,F as js}from"./CheckIn-DXUC8Vc3.js";import{A as Ee}from"./ArticleCover-DdR8hRrK.js";import"./Analytics-BsiqU_Hn.js";import"./react-vendor-CB_WXdi-.js";import"./telegram-s8e6L61o.js";import"./WebActionBar-CXryeFLS.js";import"./MarkdownText-BYwDCD2o.js";import"./personas-DJTXybnU.js";import"./checkinDraft-dMjC4Y9R.js";import"./insightDigest-CYJJY6Bi.js";import"./StreakRecovery-CuuBduvy.js";import"./pluralize-B7paa5_9.js";import"./journalHistory-CGremcAz.js";const Z=["Идея","Действие","Анализ","Новый шаг"],sa=[[22,28],[108,12],[205,30],[298,15]],ze="M22 28C52 3 78 4 108 12S165 38 205 30S260 5 298 15";function aa({checkinDone:s,done:a,total:t,todayState:i}){return i==="dayClosed"?{current:3,completedThrough:3}:i==="reviewPending"?{current:3,completedThrough:2}:s?t>0&&a>=t?{current:3,completedThrough:2}:a>0?{current:2,completedThrough:1}:{current:1,completedThrough:0}:{current:0,completedThrough:-1}}r(aa,"threadState");function ta({checkinDone:s,done:a,open:t,onOpenChange:i,total:n,todayState:l}){const{current:c,completedThrough:d}=aa({checkinDone:s,done:a,total:n,todayState:l}),m=d<0?0:d/3;return e.jsx("section",{className:"mx-day-thread","data-open":t,"aria-label":"Цикл сегодняшнего дня",style:{"--mx-thread-progress":m},children:e.jsxs("button",{type:"button",className:"mx-day-thread__toggle","aria-expanded":t,onClick:r(()=>i(!t),"onClick"),children:[e.jsxs("span",{className:"mx-day-thread__heading",children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Цикл дня"}),e.jsx("small",{children:l==="dayClosed"?"День завершён":Z[c]})]}),e.jsx(_e,{size:18,"aria-hidden":"true"})]}),e.jsxs("svg",{className:"mx-day-thread__path",viewBox:"0 0 320 40",role:"img","aria-label":`Цикл дня: ${Z[c]}`,children:[e.jsx("path",{className:"mx-day-thread__path-base",d:ze,pathLength:"1"}),e.jsx("path",{className:"mx-day-thread__path-progress",d:ze,pathLength:"1",style:{strokeDashoffset:1-m}}),sa.map(([x,h],u)=>{const p=u<=d,v=u===c&&!p;return e.jsxs("g",{className:"mx-day-thread__path-node","data-completed":p,"data-active":v,transform:`translate(${x} ${h})`,children:[e.jsx("circle",{r:"8"}),p&&e.jsx("path",{d:"M-3 0L-1 2.5L3.5-3"}),v&&e.jsx("circle",{className:"mx-day-thread__path-dot",r:"2.5"})]},Z[u])})]}),e.jsx("span",{className:"mx-day-thread__labels",children:Z.map((x,h)=>e.jsx("span",{"data-active":h===c,children:x},x))})]})})}r(ta,"DayThread");function ra(){return e.jsxs("div",{className:"mx-today-focus-mark","aria-label":"Одна главная точка внимания",children:[e.jsxs("svg",{viewBox:"0 0 120 72",role:"img","aria-hidden":"true",children:[e.jsx("path",{d:"M12 42a48 48 0 0 1 96 0"}),e.jsx("path",{d:"M26 42a34 34 0 0 1 68 0"}),e.jsx("path",{d:"M60 7v24M60 53v13"}),e.jsx("circle",{cx:"60",cy:"42",r:"4"})]}),e.jsx("span",{children:"одна точка внимания"})]})}r(ra,"FocusMark");function ia({next:s,remainingActionsText:a,onStart:t}){return e.jsxs("div",{className:"mx-today-priority mx-today-priority--next",children:[e.jsx("small",{children:"Действие дня"}),e.jsx("strong",{children:s.title}),e.jsx("span",{children:s.meta}),e.jsxs("button",{type:"button",className:"mx-today-priority__start",onClick:t,children:[e.jsx("span",{children:"Начать"}),e.jsx(E,{size:17,"aria-hidden":"true"})]}),e.jsx("p",{children:a})]})}r(ia,"NextActionReveal");const na=[{key:"hub",label:"Хаб",href:"?ui_lab=hub"},{key:"baseline",label:"Эталон",href:"?ui_lab=baseline"},{key:"compare",label:"Сравнение",href:"?ui_lab=compare"},{key:"daily-canonical",label:"Дневной цикл",href:"?ui_lab=daily-canonical"}];function _s({active:s}){return e.jsx("nav",{className:"mx-ui-lab-switch","aria-label":"Разделы UI Lab",children:na.map(a=>e.jsx("a",{href:a.href,"aria-current":a.key===s?"page":void 0,children:a.label},a.key))})}r(_s,"UiLabSwitch");const Me=[{fill:"#7B7B80",d:"M511.662 426.836L512.505 426.534C514.303 429.237 520.304 435.798 522.861 438.119C537.462 451.367 526.278 458.24 511.915 463.14C511.554 463.18 511.192 463.216 510.829 463.248C510.962 465.326 511.246 467.428 510.563 469.368C511.271 469.708 511.192 469.687 511.954 469.823C519.164 470.693 531.834 471.899 534.438 479.72C538.226 480.168 552.07 481.354 551.578 487.688C551.078 494.113 532.07 498.814 531.677 502.092C533.25 504.594 537.747 505.747 540.603 506.296C555.821 509.221 571.329 511.39 586.599 514.055C591.484 514.908 599.695 515.937 604.194 517.234C605.202 533.505 604.532 556.301 604.532 573.156C615.414 575.927 628.198 578.284 639.345 580.66L682.685 590.16C696.984 593.16 713.666 596.322 727.334 601.358C732.081 603.107 736.954 607.38 740.419 611.02C743.611 625.926 742.905 650.421 743.047 665.772L743.593 748.701L934.162 800.982L991.571 816.607C999.465 818.723 1017.18 822.94 1024 825.816L1024 826.801C1016.14 824.089 1006.55 821.774 998.392 819.591C985.336 816.137 972.305 812.59 959.299 808.948L794.145 763.629C773.159 757.791 751.842 752.626 731.236 745.619C705.13 736.743 679.362 726.493 655.443 712.717C651.262 710.174 644.932 706.26 641.396 702.967C640.752 702.445 640.446 702.19 639.774 701.744C639.641 701.342 639.54 700.605 639.48 700.264L639.357 699.96L638.344 700.25C632.721 694.907 626.248 688.018 625.902 679.962C624.852 655.547 673.264 638.724 691.867 632.368C704.085 628.194 718.295 625.178 730.246 619.944C734.836 617.933 737.214 616.031 740.38 612.269C731.803 603.494 724.656 600.771 712.788 597.959C704.177 595.919 695.559 594.036 686.901 592.199L632.364 580.331C616.813 577.078 600.608 573.891 585.252 569.877C572.112 566.442 549.735 561.681 545.129 547.502C551.857 526.707 585.717 529.744 600.905 519.372C601.632 518.876 601.17 518.956 601.973 519.04C598.906 528.463 552.834 526.834 546.476 547.203L546.281 547.848L546.578 548.599C552.384 563.676 589.049 569.387 603.632 573.088C603.768 562.298 603.703 551.261 603.693 540.465C603.688 534.241 603.848 525.703 603.307 519.683C600.134 513.684 532.689 510.732 530.353 502.128C532.539 495.554 548.362 496.271 550.112 487.235C547.703 478.768 519.642 480.999 511.854 481.032L511.157 480.872C504.982 480.836 496.942 480.792 491.445 480.906C470.723 481.336 466.231 488.976 487.501 497.319C489.656 498.164 491.78 499.377 493.023 501.341C492.992 502.374 493.057 502.67 492.266 503.438C485.256 510.23 433.159 514.64 420.031 518.353L419.918 573.102C434.471 569.525 506.193 556.38 465.001 534.762C452.908 528.415 432.111 527.515 421.285 519.678L421.332 519.154C422.437 519.499 422.401 519.651 423.344 520.122C436.649 526.768 461.711 528.969 472.866 538.503C499.396 561.176 419.524 574.168 407.967 576.732L330.766 593.701C321.073 595.842 303.4 599.175 294.99 603.211C290.476 605.347 286.698 608.775 284.135 613.061L284.633 613.66C290.787 621.005 303.239 623.851 312.199 626.455C393.536 650.094 444.546 681.595 336.771 728.565C319.378 736.112 301.652 742.867 283.647 748.808C253.261 758.526 216.546 767.228 185.416 775.86L57.9071 811.069C39.1288 816.223 18.4769 821.24 0 826.758L0 825.556L187.657 774.03C218.167 765.606 249.951 757.676 280.222 748.675C280.167 729.047 278.782 619.318 284.531 610.409C287.262 606.176 293.526 602.434 298.161 600.678C309.935 596.216 325.32 593.799 337.762 590.996L419.059 573.145C419.149 554.301 419.134 535.457 419.012 516.614C423.557 516.521 436.944 514.746 441.186 513.543C449.854 511.086 488.42 508.276 491.888 501.516C489.57 497.012 473.622 494.902 472.268 487.654C473.547 479.664 487.383 480.004 493.576 479.466C493.51 474.524 493.499 470.498 493.795 465.531C505.31 462.803 522.405 462.126 528.788 450.739C528.638 449.186 528.584 448.863 528.737 447.342C524.374 438.809 515.92 434.314 511.662 426.836Z"},{fill:"#000",d:"M740.12 614.366C742.761 635.262 742.213 657.463 742.236 678.608L742.492 748.182C714.794 739.21 681.437 726.994 656.327 711.952L655.443 712.717C651.262 710.174 644.932 706.26 641.396 702.967C640.752 702.445 640.446 702.19 639.774 701.744C639.641 701.342 639.54 700.605 639.48 700.264L639.357 699.96C626.638 687.591 620.279 675.326 636.382 661.197C652.55 647.01 674.844 639.309 694.908 632.607C709.294 627.852 729.751 624.376 740.12 614.366Z"},{fill:"#626265",d:"M642.948 702.903C647.325 706.268 651.673 709.016 656.327 711.952L655.443 712.717C651.262 710.174 644.932 706.26 641.396 702.967L642.948 702.903Z"},{fill:"#7B7B80",d:"M639.48 700.264C640.95 701.171 641.617 701.848 642.948 702.903L641.396 702.967C640.752 702.445 640.446 702.19 639.774 701.744C639.641 701.342 639.54 700.605 639.48 700.264Z"},{fill:"#000",d:"M496.543 465.966C501.088 464.954 506.205 464.062 510.829 463.248C510.962 465.326 511.246 467.428 510.563 469.368C505.379 468.504 501.503 467.727 496.543 465.966Z"},{fill:"#626265",d:"M528.737 447.342C529.071 449.031 529.059 449.057 528.788 450.739C528.638 449.186 528.584 448.863 528.737 447.342Z"},{fill:"#000",d:"M284.032 614.736C293.242 624.188 311.618 626.826 324.281 630.992C343.128 637.191 360.117 642.981 377.117 653.442C417.186 678.098 390.069 698.681 362.384 714.954C338.575 727.874 307.264 739.952 281.255 748.417L281.652 667.618C281.846 649.843 281.362 632.405 284.032 614.736Z"},{fill:"#000",d:"M494.84 466.331C499.555 468.216 506.241 470.202 511.332 470.226C511.629 470.35 511.768 470.461 512.03 470.635C511.855 473.879 512.155 476.663 511.8 479.997C509.007 480.021 505.975 480.062 503.235 479.616C501.138 479.774 496.88 479.593 494.638 479.561C494.502 475.262 494.394 470.6 494.84 466.331Z"},{fill:"#232325",d:"M511.332 470.226C511.629 470.35 511.768 470.461 512.03 470.635C511.855 473.879 512.155 476.663 511.8 479.997C509.007 480.021 505.975 480.062 503.235 479.616C506.331 479.319 507.903 479.381 511.015 479.527C510.98 476.208 510.785 473.501 511.332 470.226Z"},{fill:"#000",d:"M512.03 470.635C516.24 471.406 529.661 473.645 531.972 476.974C534.933 481.239 524.069 479.528 522.75 479.873C519.156 480.088 515.392 479.921 511.8 479.997C512.155 476.663 511.855 473.879 512.03 470.635Z"},{fill:"#232325",d:"M511.503 1024C510.565 1016.81 511.381 999.108 511.318 990.648L511.278 900.328L511.216 612.99L511.24 525.111C511.239 523.414 511.395 515.908 510.963 515.286C508.606 511.897 505.355 512.914 511.372 507.985C513.621 508.42 515.278 510.547 514.946 512.91L514.494 513.454C512.873 515.444 511.867 516.565 511.902 519.18C512.092 533.174 512.041 547.283 512.049 561.272L512.35 666.774L511.916 1024L511.503 1024Z"},{fill:"#000",d:"M510.061 509.841C511.334 511.05 510.998 511.841 510.752 513.634L510.561 513.484C509.217 512.45 508.565 511.936 509.669 510.402L510.061 509.841Z"},{fill:"#232325",d:"M511.157 480.872L511.854 481.032C511.991 483.662 512.244 505.599 511.693 506.954L511.598 506.98C510.484 506.33 510.979 483.851 511.157 480.872Z"},{fill:"#626265",d:"M639.357 699.96L639.48 700.264C639.54 700.605 639.641 701.342 639.774 701.744C639.145 701.158 638.873 700.895 638.344 700.25L639.357 699.96Z"},{fill:"#232325",d:"M511.244 0L512.022 0L512.428 254.378L512.4 334.609C512.366 343.407 512.251 352.205 512.055 361.001C511.976 367.319 512.162 373.36 511.578 379.66L511.396 379.646C510.826 363.576 511.304 344.031 511.318 327.612L511.277 240.009L511.244 0Z"},{fill:"#232325",d:"M511.485 400.647C511.659 400.656 511.833 400.66 512.007 400.659C512.176 408.647 512.54 418.769 512.505 426.534L511.662 426.836C511.185 424.794 511.21 403.069 511.485 400.647Z"},{fill:"#232325",d:"M510.829 463.248C511.192 463.216 511.554 463.18 511.915 463.14C511.943 465.368 511.956 467.595 511.954 469.823C511.192 469.687 511.271 469.708 510.563 469.368C511.246 467.428 510.962 465.326 510.829 463.248Z"}],ge=Me[0].d,la=Me[1].d,ca="M511.503 1024C510.565 1016.81 511.381 999.108 511.318 990.648L511.278 900.328L511.216 612.99L511.24 525.111C511.239 523.414 511.395 515.908 510.963 515.286C508.606 511.897 505.355 512.914 511.372 507.985C513.621 508.42 515.278 510.547 514.946 512.91L514.494 513.454C512.873 515.444 511.867 516.565 511.902 519.18C512.092 533.174 512.041 547.283 512.049 561.272L512.35 666.774L511.916 1024L511.503 1024Z",oa="M511.244 0L512.022 0L512.428 254.378L512.4 334.609C512.366 343.407 512.251 352.205 512.055 361.001C511.976 367.319 512.162 373.36 511.578 379.66L511.396 379.646C510.826 363.576 511.304 344.031 511.318 327.612L511.277 240.009L511.244 0Z",da="M511.485 400.647C506.187 400.391 502.077 395.925 502.262 390.624C502.447 385.322 506.857 381.153 512.161 381.267C517.464 381.38 521.692 385.734 521.65 391.039C521.608 396.343 517.311 400.629 512.007 400.659C511.833 400.66 511.659 400.656 511.485 400.647Z",ma=`path("${ge}")`;function ce({className:s="",animated:a=!0,accent:t}){return e.jsxs("svg",{viewBox:"0 0 1024 1024",className:`mx-my-path ${s}`,"data-animated":a,"data-accent":t,preserveAspectRatio:"xMidYMid meet","aria-hidden":"true",children:[e.jsx("rect",{className:"mx-my-path__backdrop",x:"0",y:"0",width:"1024",height:"1024"}),e.jsx("g",{className:"mx-my-path__figure",children:Me.map((i,n)=>e.jsx("path",{d:i.d,fill:i.fill},n))}),e.jsxs("g",{className:"mx-my-path__traces",fill:"none",children:[e.jsx("path",{className:"mx-my-path__trace mx-my-path__trace--axis",d:oa}),e.jsx("path",{className:"mx-my-path__trace mx-my-path__trace--axis",d:ca}),e.jsx("path",{className:"mx-my-path__trace mx-my-path__trace--main",d:ge}),e.jsx("path",{className:"mx-my-path__trace mx-my-path__trace--branch",d:la})]}),e.jsx("path",{className:"mx-my-path__walker-trail",d:ge,pathLength:"1",fill:"none"}),e.jsx("path",{className:"mx-my-path__gold",d:da,style:{offsetPath:ma}})]})}r(ce,"MyPathGlyph");const X=6e4,xa=(1+Math.sqrt(5))/2,H=["вдох","пауза","выдох","пауза"];function ha(){return Array.from({length:144},(i,n)=>{const l=n/143*Math.PI*3.5,c=112*Math.pow(xa,-l/(Math.PI/2)),d=160+c*Math.cos(l),m=126+c*Math.sin(l);return`${n===0?"M":"L"}${d.toFixed(2)} ${m.toFixed(2)}`}).join(" ")}r(ha,"makeGoldenSpiralPath");const pa=ha();function ua(){const s=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],a=new Date,t=new Date(a);return t.setDate(a.getDate()-(a.getDay()+6)%7),e.jsx("div",{className:"mx-lab-today__week",children:s.map((i,n)=>{const l=new Date(t);l.setDate(t.getDate()+n);const c=l.toDateString()===a.toDateString(),d=n===Math.max(0,(a.getDay()+6)%7-1);return e.jsxs("div",{"data-active":c,"data-completed":d,children:[e.jsx("span",{children:i}),e.jsx("strong",{children:d?e.jsx(K,{"aria-hidden":"true"}):l.getDate()})]},i)})})}r(ua,"PreviewWeek");function ba({mode:s}){const[a,t]=o.useState(!1),i={title:"Записать главную мысль",meta:"ритуал"};return e.jsxs("section",{className:"mx-lab-today-context",children:[e.jsxs("div",{className:"mx-lab-today-context__head",children:[e.jsx("span",{children:"В контексте приложения"}),e.jsx("h2",{children:"Экран «Сегодня»"}),e.jsx("p",{children:"Переключатель выше меняет текущую композицию на экспериментальную без изменения данных."})]}),e.jsxs("div",{className:"mx-lab-today",children:[e.jsxs("div",{className:"mx-lab-today__app-head",children:[e.jsxs("span",{className:"mx-lab-today__streak","aria-label":"Серия: 1 день",children:[e.jsx(Gs,{"aria-hidden":"true"}),e.jsx("strong",{children:"1"})]}),e.jsx("strong",{className:"mx-lab-today__greeting",children:"добрый вечер."}),e.jsx("button",{type:"button",className:"mx-lab-today__profile","aria-label":"Профиль",children:e.jsx(Vs,{"aria-hidden":"true"})})]}),e.jsx("p",{className:"mx-lab-today__tagline",children:"шаг за шагом — выход находится"}),e.jsx(ua,{}),s==="after"&&a&&e.jsx(ta,{checkinDone:!0,done:1,open:a,onOpenChange:t,total:3,todayState:"dayInProgress"}),e.jsxs("div",{className:"mx-lab-today__hero",children:[s==="after"?e.jsx(ra,{}):e.jsx("div",{className:"mx-lab-today__art",children:e.jsx(Es,{state:"dayInProgress",done:1,total:3,className:"w-full h-full"})}),s==="after"?e.jsx(ia,{next:i,remainAfter:2,onStart:r(()=>{},"onStart")}):e.jsxs("div",{className:"mx-lab-today__before-action",children:[e.jsx("small",{children:"Самое важное"}),e.jsx("strong",{children:i.title}),e.jsx("span",{children:i.meta}),e.jsx("button",{type:"button",children:"Начать"}),e.jsx("p",{children:"После этого останется: 2"})]})]}),e.jsx("div",{className:"mx-lab-today__nav","aria-hidden":"true",children:[0,1,2,3,4].map(n=>e.jsx("span",{"data-active":n===0},n))})]})]})}r(ba,"TodayScreenPreview");function f({number:s,eyebrow:a,title:t,purpose:i,mode:n,children:l}){return e.jsxs("section",{id:`ui-lab-sketch-${s}`,className:"mx-lab-experiment","data-mode":n,children:[e.jsxs("div",{className:"mx-lab-experiment__head",children:[e.jsx("span",{className:"mx-lab-experiment__number",children:s}),e.jsxs("div",{children:[e.jsx("p",{className:"mx-lab-experiment__eyebrow",children:a}),e.jsx("h2",{children:t}),e.jsx("p",{className:"mx-lab-experiment__purpose",children:i})]})]}),e.jsx("div",{className:"mx-lab-stage",children:l})]})}r(f,"ExperimentShell");function ja({mode:s}){const[a,t]=o.useState(!1);return o.useEffect(()=>{const i=r(n=>{n.key==="Escape"&&t(!1)},"onKeyDown");return window.addEventListener("keydown",i),()=>{window.removeEventListener("keydown",i)}},[]),e.jsx(f,{number:"01",eyebrow:"Раскрытие",title:"Один ближайший шаг",purpose:"Карточка сохраняет пространственный контекст и раскрывает ровно ту информацию, которая нужна перед началом ритуала.",mode:s,children:e.jsxs("div",{className:"mx-lab-expand","data-open":a,children:[e.jsxs("button",{type:"button",className:"mx-lab-expand__trigger","aria-expanded":a,onClick:r(()=>t(!0),"onClick"),children:[e.jsx("span",{className:"mx-lab-orbit-mark","aria-hidden":"true",children:e.jsx("span",{})}),e.jsxs("span",{className:"mx-lab-expand__copy",children:[e.jsx("small",{children:"Ритуал · 5 минут"}),e.jsx("strong",{children:"Записать главную мысль"}),e.jsx("span",{children:"Сначала увидеть, потом действовать"})]}),e.jsx(E,{size:18,"aria-hidden":"true"})]}),e.jsxs("div",{className:"mx-lab-expand__layer","aria-hidden":!a,children:[e.jsx("button",{type:"button",className:"mx-lab-expand__backdrop",tabIndex:a?0:-1,"aria-label":"Закрыть карточку",onClick:r(()=>t(!1),"onClick")}),e.jsxs("div",{className:"mx-lab-expand__dialog",role:"dialog","aria-modal":"true","aria-label":"Записать главную мысль",children:[e.jsxs("div",{className:"mx-lab-expand__dialog-head",children:[e.jsx("span",{className:"mx-lab-orbit-mark","aria-hidden":"true",children:e.jsx("span",{})}),e.jsx("button",{type:"button",className:"mx-lab-icon-button",tabIndex:a?0:-1,"aria-label":"Закрыть",onClick:r(()=>t(!1),"onClick"),children:e.jsx(Ce,{size:18})})]}),e.jsx("small",{children:"Ритуал · 5 минут"}),e.jsx("h3",{children:"Записать главную мысль"}),e.jsx("p",{children:"Сформулируй одно предложение: что сегодня действительно требует твоего внимания?"}),e.jsx("div",{className:"mx-lab-expand__prompt",children:"Не план на весь день. Только одна ясная мысль."}),e.jsxs("button",{type:"button",className:"mx-lab-primary",tabIndex:a?0:-1,onClick:r(()=>t(!1),"onClick"),children:["Начать",e.jsx(E,{size:17})]})]})]})]})})}r(ja,"ExpansionExperiment");function _a({mode:s}){const[a,t]=o.useState(!1),[i,n]=o.useState(22e3),l=o.useRef(null);o.useEffect(()=>{if(!a)return;const m=window.setInterval(()=>{const h=Math.min(Date.now()-l.current,X);n(h),h>=X&&t(!1)},100),x=r(()=>{document.hidden&&t(!1)},"pauseWhenHidden");return document.addEventListener("visibilitychange",x),()=>{window.clearInterval(m),document.removeEventListener("visibilitychange",x)}},[a]);const c=Math.min(i/X,1),d=Math.max(0,Math.ceil((X-i)/1e3));return e.jsx(f,{number:"02",eyebrow:"Атмосфера",title:"Поле внимания",purpose:"Геометрия показывает ход короткой фокус-сессии: движение начинается только вместе с таймером и замирает на паузе.",mode:s,children:e.jsxs("div",{className:"mx-lab-focus","data-running":a,style:{"--mx-progress":c},children:[e.jsxs("svg",{className:"mx-lab-focus__field",viewBox:"0 0 320 250",role:"img","aria-label":`Осталось ${d} секунд`,children:[e.jsxs("g",{className:"mx-lab-focus__quiet-lines",children:[e.jsx("path",{d:"M40 126H280"}),e.jsx("path",{d:"M160 24V226"}),e.jsx("circle",{cx:"160",cy:"126",r:"92"}),e.jsx("circle",{cx:"160",cy:"126",r:"66"})]}),e.jsxs("g",{className:"mx-lab-focus__moving-field",children:[e.jsx("path",{d:"M72 84A102 102 0 0 1 248 84"}),e.jsx("path",{d:"M86 190A96 96 0 0 0 234 190"})]}),e.jsx("circle",{className:"mx-lab-focus__track",cx:"160",cy:"126",r:"48"}),e.jsx("circle",{className:"mx-lab-focus__progress",cx:"160",cy:"126",r:"48",pathLength:"1",style:{strokeDashoffset:1-c}}),e.jsx("g",{className:"mx-lab-focus__marker",style:{transform:`rotate(${c*360}deg)`},children:e.jsx("circle",{cx:"160",cy:"78",r:"3.5"})}),e.jsx("circle",{className:"mx-lab-focus__center",cx:"160",cy:"126",r:"3"})]}),e.jsxs("div",{className:"mx-lab-focus__readout",children:[e.jsx("small",{children:a?"Сессия идёт":"Короткий фокус"}),e.jsxs("strong",{children:["0:",String(d).padStart(2,"0")]}),e.jsx("span",{children:"одна задача · без переключений"})]}),e.jsxs("div",{className:"mx-lab-focus__actions",children:[e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>{if(a){t(!1);return}l.current=Date.now()-i,t(!0)},"onClick"),children:[a?e.jsx(F,{size:17}):e.jsx(G,{size:17}),a?"Пауза":"Продолжить"]}),e.jsx("button",{type:"button",className:"mx-lab-icon-button","aria-label":"Начать заново",onClick:r(()=>{t(!1),n(0)},"onClick"),children:e.jsx(O,{size:17})})]})]})})}r(_a,"FocusExperiment");function ga({mode:s}){const[a,t]=o.useState(!1);return e.jsx(f,{number:"03",eyebrow:"Micro-interaction",title:"Ритуал услышал действие",purpose:"Нажатие сразу подтверждается, а завершённое состояние остаётся спокойным и однозначным — без конфетти и декоративного шума.",mode:s,children:e.jsxs("div",{className:"mx-lab-completion","data-complete":a,children:[e.jsx("div",{className:"mx-lab-completion__art","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 140 100",children:[e.jsx("circle",{cx:"70",cy:"50",r:"33"}),e.jsx("path",{d:"M26 50H114"}),e.jsx("path",{d:"M70 14V86"}),e.jsx("path",{className:"mx-lab-completion__check",d:"m55 50 10 10 22-24"}),e.jsx("circle",{className:"mx-lab-completion__point",cx:"103",cy:"50",r:"3.5"})]})}),e.jsxs("div",{className:"mx-lab-completion__copy",children:[e.jsx("small",{children:a?"Отмечено сегодня":"Утренний ритуал"}),e.jsx("h3",{children:"Стакан воды"}),e.jsx("p",{children:a?"Шаг учтён. Ничего больше не требуется.":"Маленькое действие перед началом дня."})]}),e.jsxs("button",{type:"button",className:"mx-lab-complete-button",onClick:r(()=>t(i=>!i),"onClick"),children:[e.jsx("span",{className:"mx-lab-complete-button__icon",children:e.jsx(K,{size:17})}),e.jsx("span",{children:a?"Готово":"Отметить"})]})]})})}r(ga,"CompletionExperiment");function ya({mode:s}){const[a,t]=o.useState(!1),[i,n]=o.useState(0);return o.useEffect(()=>{if(!a)return;const l=window.setInterval(()=>{n(c=>(c+1)%H.length)},3e3);return()=>{window.clearInterval(l)}},[a]),e.jsx(f,{number:"04",eyebrow:"SVG + motion",title:"Дыхательный ориентир",purpose:"Фирменные дуги объясняют фазу упражнения. Движение не украшает экран, а заменяет необходимость постоянно читать таймер.",mode:s,children:e.jsxs("div",{className:"mx-lab-breath","data-active":a,"data-phase":i,children:[e.jsxs("div",{className:"mx-lab-breath__visual",children:[e.jsxs("svg",{viewBox:"0 0 240 240","aria-hidden":"true",children:[e.jsxs("g",{className:"mx-lab-breath__rays",children:[e.jsx("path",{d:"M120 18V42"}),e.jsx("path",{d:"m48 48 17 17"}),e.jsx("path",{d:"M18 120H42"}),e.jsx("path",{d:"m48 192 17-17"}),e.jsx("path",{d:"M120 222V198"}),e.jsx("path",{d:"m192 192-17-17"}),e.jsx("path",{d:"M222 120H198"}),e.jsx("path",{d:"m192 48-17 17"})]}),e.jsx("circle",{className:"mx-lab-breath__ring mx-lab-breath__ring--outer",cx:"120",cy:"120",r:"72"}),e.jsx("circle",{className:"mx-lab-breath__ring mx-lab-breath__ring--inner",cx:"120",cy:"120",r:"47"}),e.jsx("path",{className:"mx-lab-breath__arc",d:"M120 48a72 72 0 0 1 72 72"}),e.jsx("circle",{className:"mx-lab-breath__core",cx:"120",cy:"120",r:"8"})]}),e.jsxs("div",{className:"mx-lab-breath__label","aria-live":"polite",children:[e.jsx("small",{children:a?"Следуй за кругом":"Практика · 1 минута"}),e.jsx("strong",{children:a?H[i]:"готов?"})]})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>{t(l=>!l),a&&n(0)},"onClick"),children:[a?e.jsx(F,{size:17}):e.jsx(G,{size:17}),a?"Остановить":"Начать дыхание"]})]})})}r(ya,"BreathingExperiment");function va({mode:s}){const[a,t]=o.useState(1),i=["бережно","ровно","есть импульс"];return e.jsx(f,{number:"05",eyebrow:"State prototype",title:"Состояние отвечает формой",purpose:"Rive-подобная логика без чужого визуала: одна иллюстрация меняет состояние вслед за выбором энергии и подтверждает, что чек-ин понят.",mode:s,children:e.jsxs("div",{className:"mx-lab-checkin","data-energy":a,children:[e.jsx("div",{className:"mx-lab-checkin__visual","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 300 190",children:[e.jsxs("g",{className:"mx-lab-checkin__horizon",children:[e.jsx("path",{d:"M32 95H268"}),e.jsx("circle",{cx:"150",cy:"95",r:"62"})]}),e.jsx("g",{className:"mx-lab-checkin__orbit mx-lab-checkin__orbit--one",children:e.jsx("ellipse",{cx:"150",cy:"95",rx:"98",ry:"32"})}),e.jsx("g",{className:"mx-lab-checkin__orbit mx-lab-checkin__orbit--two",children:e.jsx("ellipse",{cx:"150",cy:"95",rx:"82",ry:"46"})}),e.jsxs("g",{className:"mx-lab-checkin__needle",children:[e.jsx("path",{d:"M150 95 150 45"}),e.jsx("circle",{cx:"150",cy:"42",r:"4"})]}),e.jsx("circle",{className:"mx-lab-checkin__core",cx:"150",cy:"95",r:"8"})]})}),e.jsxs("div",{className:"mx-lab-checkin__copy",children:[e.jsx("small",{children:"Энергия сейчас"}),e.jsx("strong",{children:i[a]})]}),e.jsx("div",{className:"mx-lab-checkin__choices","aria-label":"Уровень энергии",children:i.map((n,l)=>e.jsx("button",{type:"button","aria-label":n,"aria-pressed":a===l,onClick:r(()=>t(l),"onClick"),children:e.jsx("span",{})},n))})]})})}r(va,"CheckinExperiment");function fa({mode:s}){const[a,t]=o.useState(0);return e.jsx(f,{number:"06",eyebrow:"Пропорция φ",title:"Спираль внимания",purpose:"Каждая четверть оборота уменьшается в φ раз. Линия не просто украшает экран — она показывает, как широкое поле внимания последовательно сводится к одной мысли.",mode:s,children:e.jsxs("div",{className:"mx-lab-phi mx-lab-phi-spiral",children:[e.jsx("div",{className:"mx-lab-phi__visual",children:e.jsxs("svg",{viewBox:"0 0 320 252",role:"img","aria-label":"Золотая спираль сужается к точке внимания",children:[e.jsxs("g",{className:"mx-lab-phi__guides",children:[e.jsx("path",{d:"M24 126H296"}),e.jsx("path",{d:"M160 20V232"}),e.jsx("rect",{x:"48",y:"57",width:"224",height:"138.44",rx:"4"}),e.jsx("circle",{cx:"160",cy:"126",r:"42.8"})]}),e.jsx("path",{className:"mx-lab-phi-spiral__path",d:pa},a),e.jsx("circle",{className:"mx-lab-phi__core",cx:"160",cy:"126",r:"4"})]})}),e.jsxs("div",{className:"mx-lab-phi__copy",children:[e.jsx("small",{children:"φ = 1.618"}),e.jsx("strong",{children:"От поля — к одной точке"})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(i=>i+1),"onClick"),children:[e.jsx(O,{size:17}),"Дорисовать снова"]})]})})}r(fa,"GoldenSpiralExperiment");function Na({mode:s}){const[a,t]=o.useState(!1);return e.jsx(f,{number:"07",eyebrow:"Золотая орбита",title:"Ритм без случайных пропорций",purpose:"Большая и малая оси орбиты соотносятся как 1.618. Точка движется только во время фокус-сессии и делает её ход видимым без отдельного таймера в центре.",mode:s,children:e.jsxs("div",{className:"mx-lab-phi mx-lab-phi-ellipse","data-running":a&&s==="after",children:[e.jsxs("div",{className:"mx-lab-phi__visual mx-lab-phi-ellipse__visual",children:[e.jsxs("svg",{viewBox:"0 0 320 252",role:"img","aria-label":"Эллиптическая орбита с пропорцией золотого сечения",children:[e.jsxs("g",{className:"mx-lab-phi__guides",children:[e.jsx("path",{d:"M36 126H284"}),e.jsx("path",{d:"M160 40V212"}),e.jsx("rect",{x:"55",y:"61.1",width:"210",height:"129.8",rx:"4"})]}),e.jsx("ellipse",{className:"mx-lab-phi-ellipse__orbit",cx:"160",cy:"126",rx:"105",ry:"64.9"}),e.jsx("ellipse",{className:"mx-lab-phi-ellipse__inner",cx:"160",cy:"126",rx:"64.9",ry:"40.1"}),e.jsx("circle",{className:"mx-lab-phi-ellipse__center",cx:"160",cy:"126",r:"3"})]}),e.jsx("span",{className:"mx-lab-phi-ellipse__marker","aria-hidden":"true"})]}),e.jsxs("div",{className:"mx-lab-phi__copy",children:[e.jsx("small",{children:"210 ÷ 129.8 = 1.618"}),e.jsx("strong",{children:a?"Фокус удерживается":"Орбита ждёт действия"})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(i=>!i),"onClick"),children:[a?e.jsx(F,{size:17}):e.jsx(G,{size:17}),a?"Пауза":"Начать фокус"]})]})})}r(Na,"GoldenEllipseExperiment");function wa({mode:s}){const[a,t]=o.useState(0),i=[104,64.3,39.7,24.5];return e.jsx(f,{number:"08",eyebrow:"Собственная идея",title:"Золотая диафрагма",purpose:"Четыре уровня внимания уменьшаются последовательно по φ. Нажатие не запускает декоративный цикл, а буквально сужает область выбора до следующего уровня.",mode:s,children:e.jsxs("div",{className:"mx-lab-phi mx-lab-phi-aperture","data-depth":a,children:[e.jsx("div",{className:"mx-lab-phi__visual",children:e.jsxs("svg",{viewBox:"0 0 320 252",role:"img","aria-label":`Глубина фокуса: ${a+1} из 4`,children:[e.jsxs("g",{className:"mx-lab-phi__guides",children:[e.jsx("path",{d:"M32 126H288"}),e.jsx("path",{d:"M160 22V230"})]}),i.map((n,l)=>e.jsxs("g",{className:"mx-lab-phi-aperture__ring","data-ring":l,"data-reached":l<=a,children:[e.jsx("path",{d:`M${160-n} 126A${n} ${n} 0 0 1 ${160+n} 126`}),e.jsx("path",{d:`M${160+n} 126A${n} ${n} 0 0 1 ${160-n} 126`})]},n)),e.jsx("circle",{className:"mx-lab-phi__core",cx:"160",cy:"126",r:"4"})]})}),e.jsxs("div",{className:"mx-lab-phi__copy",children:[e.jsxs("small",{children:["Уровень ",a+1," · радиус ÷ φ"]}),e.jsx("strong",{children:a===3?"Осталась одна точка":"Сузить область выбора"})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(n=>(n+1)%i.length),"onClick"),children:[a===3?e.jsx(O,{size:17}):e.jsx(E,{size:17}),a===3?"Начать снова":"Следующий уровень"]})]})})}r(wa,"GoldenApertureExperiment");function Ca({mode:s}){const[a,t]=o.useState(1),i=["бережно","ровно","есть импульс"];return e.jsx(f,{number:"09",eyebrow:"Мягкая геометрия",title:"Состояние получает огранку",purpose:"Альтернатива круговой «Энергии сейчас»: пересекающиеся линзы сохраняют мягкость, а четыре спокойные вершины показывают направленность выбранного состояния.",mode:s,children:e.jsxs("div",{className:"mx-lab-facet","data-energy":a,children:[e.jsx("div",{className:"mx-lab-facet__visual","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 320 252",children:[e.jsxs("g",{className:"mx-lab-facet__guides",children:[e.jsx("path",{d:"M32 126H288"}),e.jsx("path",{d:"M160 24V228"})]}),e.jsx("path",{className:"mx-lab-facet__frame",d:"M160 24C190 55 230 88 282 126C230 164 190 197 160 228C130 197 90 164 38 126C90 88 130 55 160 24Z"}),e.jsxs("g",{className:"mx-lab-facet__lenses",children:[e.jsx("path",{d:"M48 126C86 72 234 72 272 126C234 180 86 180 48 126Z"}),e.jsx("path",{d:"M160 34C214 70 214 182 160 218C106 182 106 70 160 34Z"})]}),e.jsxs("g",{className:"mx-lab-facet__needle",children:[e.jsx("path",{d:"M160 126L160 67"}),e.jsx("circle",{cx:"160",cy:"62",r:"4"})]}),e.jsx("circle",{className:"mx-lab-facet__core",cx:"160",cy:"126",r:"6"})]})}),e.jsxs("div",{className:"mx-lab-facet__copy",children:[e.jsx("small",{children:"Энергия сейчас"}),e.jsx("strong",{children:i[a]})]}),e.jsx("div",{className:"mx-lab-facet__choices","aria-label":"Уровень энергии",children:i.map((n,l)=>e.jsx("button",{type:"button","aria-label":n,"aria-pressed":a===l,onClick:r(()=>t(l),"onClick"),children:e.jsx("span",{})},n))})]})})}r(Ca,"SoftFacetExperiment");function ka({mode:s}){const[a,t]=o.useState(!1);return e.jsx(f,{number:"10",eyebrow:"Альтернатива ритуалу",title:"Шаг наполняет форму",purpose:"Более выразительная замена простому знаку стакана: завершение утреннего действия спокойно наполняет сосуд и оставляет видимый след без конфетти.",mode:s,children:e.jsxs("div",{className:"mx-lab-vessel","data-complete":a,children:[e.jsx("div",{className:"mx-lab-vessel__visual",children:e.jsxs("svg",{viewBox:"0 0 320 252",role:"img","aria-label":a?"Утренний ритуал завершён":"Утренний ритуал ожидает действия",children:[e.jsx("defs",{children:e.jsx("clipPath",{id:"mx-lab-vessel-clip",children:e.jsx("path",{d:"M82 55C90 157 112 205 160 220C208 205 230 157 238 55Z"})})}),e.jsxs("g",{className:"mx-lab-vessel__guides",children:[e.jsx("path",{d:"M46 55H274"}),e.jsx("path",{d:"M160 24V228"})]}),e.jsxs("g",{className:"mx-lab-vessel__water",clipPath:"url(#mx-lab-vessel-clip)",children:[e.jsx("path",{className:"mx-lab-vessel__fill",d:"M64 118H256V236H64Z"}),e.jsx("path",{d:"M64 118C100 102 124 134 160 118C196 102 220 134 256 118"}),e.jsx("path",{d:"M76 151C108 137 130 165 160 151C190 137 212 165 244 151"})]}),e.jsx("path",{className:"mx-lab-vessel__body",d:"M82 55C90 157 112 205 160 220C208 205 230 157 238 55"}),e.jsx("path",{className:"mx-lab-vessel__rim",d:"M82 55C112 43 208 43 238 55C208 67 112 67 82 55Z"}),e.jsxs("g",{className:"mx-lab-vessel__drop",children:[e.jsx("path",{d:"M160 30C151 42 148 48 160 56C172 48 169 42 160 30Z"}),e.jsx("circle",{cx:"160",cy:"49",r:"3"})]})]})}),e.jsxs("div",{className:"mx-lab-vessel__copy",children:[e.jsx("small",{children:a?"Отмечено сегодня":"Утренний ритуал"}),e.jsx("strong",{children:"Стакан воды"}),e.jsx("span",{children:a?"Форма заполнена — шаг учтён.":"Одно спокойное действие для начала дня."})]}),e.jsxs("button",{type:"button",className:"mx-lab-complete-button",onClick:r(()=>t(i=>!i),"onClick"),children:[e.jsx("span",{className:"mx-lab-complete-button__icon",children:e.jsx(K,{size:17})}),e.jsx("span",{children:a?"Готово":"Отметить"})]})]})})}r(ka,"FillingRitualExperiment");function Sa({mode:s}){const[a,t]=o.useState(!1),[i,n]=o.useState(0);return o.useEffect(()=>{if(!a)return;const l=window.setInterval(()=>{n(c=>(c+1)%H.length)},3e3);return()=>window.clearInterval(l)},[a]),e.jsx(f,{number:"11",eyebrow:"Линзы и лепестки",title:"Дыхание раскрывается формой",purpose:"Вместо ещё одного круга четыре линзы раскрываются на вдохе и собираются на выдохе. Движение остаётся инструкцией практики, а не фоновым украшением.",mode:s,children:e.jsxs("div",{className:"mx-lab-petal","data-active":a,"data-phase":i,children:[e.jsxs("div",{className:"mx-lab-petal__visual",children:[e.jsxs("svg",{viewBox:"0 0 320 252","aria-hidden":"true",children:[e.jsxs("g",{className:"mx-lab-petal__guides",children:[e.jsx("path",{d:"M42 126H278"}),e.jsx("path",{d:"M160 20V232"}),e.jsx("path",{d:"M82 48L238 204"}),e.jsx("path",{d:"M238 48L82 204"})]}),e.jsx("path",{className:"mx-lab-petal__frame",d:"M160 30C190 68 226 96 272 126C226 156 190 184 160 222C130 184 94 156 48 126C94 96 130 68 160 30Z"}),e.jsxs("g",{className:"mx-lab-petal__petals",children:[e.jsx("path",{d:"M160 126C128 94 132 52 160 28C188 52 192 94 160 126Z"}),e.jsx("path",{d:"M160 126C192 94 234 98 258 126C234 154 192 158 160 126Z"}),e.jsx("path",{d:"M160 126C192 158 188 200 160 224C132 200 128 158 160 126Z"}),e.jsx("path",{d:"M160 126C128 158 86 154 62 126C86 98 128 94 160 126Z"})]}),e.jsx("circle",{className:"mx-lab-petal__halo",cx:"160",cy:"126",r:"34"}),e.jsx("circle",{className:"mx-lab-petal__core",cx:"160",cy:"126",r:"6"})]}),e.jsxs("div",{className:"mx-lab-petal__label","aria-live":"polite",children:[e.jsx("small",{children:a?"Следуй за формой":"Практика · 1 минута"}),e.jsx("strong",{children:a?H[i]:"готов?"})]})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>{t(l=>!l),a&&n(0)},"onClick"),children:[a?e.jsx(F,{size:17}):e.jsx(G,{size:17}),a?"Остановить":"Начать дыхание"]})]})})}r(Sa,"PetalBreathingExperiment");function Ea({mode:s}){const[a,t]=o.useState(0),i=["Широкое поле","Только важное","Одна мысль"];return e.jsx(f,{number:"12",eyebrow:"Референс · линза",title:"Выбор становится уже",purpose:"Три мягкие линзы заменяют привычную мишень: каждый шаг убирает лишнее и оставляет более точную область решения.",mode:s,children:e.jsxs("div",{className:"mx-lab-ref mx-lab-choice-lens","data-depth":a,children:[e.jsx("div",{className:"mx-lab-ref__visual","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 320 252",children:[e.jsxs("g",{className:"mx-lab-ref__guides",children:[e.jsx("path",{d:"M28 126H292"}),e.jsx("path",{d:"M160 26V226"})]}),e.jsx("path",{className:"mx-lab-choice-lens__shape","data-lens":"0",d:"M32 126C82 48 238 48 288 126C238 204 82 204 32 126Z"}),e.jsx("path",{className:"mx-lab-choice-lens__shape","data-lens":"1",d:"M68 126C106 76 214 76 252 126C214 176 106 176 68 126Z"}),e.jsx("path",{className:"mx-lab-choice-lens__shape","data-lens":"2",d:"M108 126C130 101 190 101 212 126C190 151 130 151 108 126Z"}),e.jsx("circle",{className:"mx-lab-ref__core",cx:"160",cy:"126",r:"5"})]})}),e.jsxs("div",{className:"mx-lab-ref__copy",children:[e.jsxs("small",{children:["Уровень выбора ",a+1," из 3"]}),e.jsx("strong",{children:i[a]})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(n=>(n+1)%i.length),"onClick"),children:[a===2?e.jsx(O,{size:17}):e.jsx(E,{size:17}),a===2?"Сначала":"Сузить выбор"]})]})})}r(Ea,"ChoiceLensExperiment");function Ma({mode:s}){const[a,t]=o.useState(1),i=["тихо","устойчиво","живой импульс"];return e.jsx(f,{number:"13",eyebrow:"Референс · контур",title:"Энергия меняет границу",purpose:"Не круг и не ромб, а мягкая мембрана: выбранная энергия меняет её напряжение, наклон и внутреннее пространство.",mode:s,children:e.jsxs("div",{className:"mx-lab-ref mx-lab-contour","data-energy":a,children:[e.jsx("div",{className:"mx-lab-ref__visual","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 320 252",children:[e.jsxs("g",{className:"mx-lab-ref__guides",children:[e.jsx("path",{d:"M34 126H286"}),e.jsx("path",{d:"M160 24V228"})]}),e.jsxs("g",{className:"mx-lab-contour__membrane",children:[e.jsx("path",{d:"M160 28C216 32 276 72 278 126C276 180 216 220 160 224C104 220 44 180 42 126C44 72 104 32 160 28Z"}),e.jsx("path",{d:"M160 58C202 60 244 88 246 126C244 164 202 192 160 194C118 192 76 164 74 126C76 88 118 60 160 58Z"})]}),e.jsxs("g",{className:"mx-lab-contour__axis",children:[e.jsx("path",{d:"M103 157L217 95"}),e.jsx("path",{d:"M112 102L208 150"})]}),e.jsx("circle",{className:"mx-lab-ref__core",cx:"160",cy:"126",r:"6"})]})}),e.jsxs("div",{className:"mx-lab-ref__copy",children:[e.jsx("small",{children:"Энергия сейчас"}),e.jsx("strong",{children:i[a]})]}),e.jsx("div",{className:"mx-lab-ref__choices","aria-label":"Уровень энергии",children:i.map((n,l)=>e.jsx("button",{type:"button","aria-label":n,"aria-pressed":a===l,onClick:r(()=>t(l),"onClick"),children:e.jsx("span",{})},n))})]})})}r(Ma,"LivingContourExperiment");function Pa({mode:s}){const[a,t]=o.useState(!1),[i,n]=o.useState(0);return o.useEffect(()=>{if(!a)return;const l=window.setInterval(()=>{n(c=>(c+1)%H.length)},3e3);return()=>window.clearInterval(l)},[a]),e.jsx(f,{number:"14",eyebrow:"Референс · волна",title:"Дыхание проходит через линию",purpose:"Две волны расходятся на вдохе и возвращаются на выдохе. Такой ориентир мягче лепестков и подходит для спокойной ежедневной практики.",mode:s,children:e.jsxs("div",{className:"mx-lab-ref mx-lab-wave","data-active":a,"data-phase":i,children:[e.jsxs("div",{className:"mx-lab-ref__visual mx-lab-wave__visual",children:[e.jsxs("svg",{viewBox:"0 0 320 252","aria-hidden":"true",children:[e.jsxs("g",{className:"mx-lab-ref__guides",children:[e.jsx("path",{d:"M26 126H294"}),e.jsx("path",{d:"M160 34V218"})]}),e.jsxs("g",{className:"mx-lab-wave__upper",children:[e.jsx("path",{d:"M30 126C68 74 108 74 146 126C184 178 224 178 290 126"}),e.jsx("path",{d:"M46 126C82 94 114 94 150 126C186 158 218 158 274 126"})]}),e.jsxs("g",{className:"mx-lab-wave__lower",children:[e.jsx("path",{d:"M30 126C68 178 108 178 146 126C184 74 224 74 290 126"}),e.jsx("path",{d:"M46 126C82 158 114 158 150 126C186 94 218 94 274 126"})]}),e.jsx("circle",{className:"mx-lab-ref__core",cx:"160",cy:"126",r:"5"})]}),e.jsxs("div",{className:"mx-lab-wave__label","aria-live":"polite",children:[e.jsx("small",{children:a?"Следуй за волной":"Практика · 1 минута"}),e.jsx("strong",{children:a?H[i]:"готов?"})]})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>{t(l=>!l),a&&n(0)},"onClick"),children:[a?e.jsx(F,{size:17}):e.jsx(G,{size:17}),a?"Остановить":"Начать дыхание"]})]})})}r(Pa,"BreathingWaveExperiment");function Aa({mode:s}){const[a,t]=o.useState(0),i=[[58,194],[96,194],[96,156],[158,156],[158,94],[258,94]],[n,l]=i[a];return e.jsx(f,{number:"15",eyebrow:"Референс · Fibonacci",title:"Шаги складываются в маршрут",purpose:"Последовательность 1·1·2·3·5 превращается в путь практики: золотая точка переходит только после реального следующего шага.",mode:s,children:e.jsxs("div",{className:"mx-lab-ref mx-lab-route","data-step":a,children:[e.jsx("div",{className:"mx-lab-ref__visual","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 320 252",children:[e.jsxs("g",{className:"mx-lab-ref__guides mx-lab-route__blocks",children:[e.jsx("rect",{x:"40",y:"176",width:"36",height:"36"}),e.jsx("rect",{x:"76",y:"176",width:"36",height:"36"}),e.jsx("rect",{x:"76",y:"140",width:"72",height:"72"}),e.jsx("rect",{x:"148",y:"104",width:"108",height:"108"})]}),e.jsx("path",{className:"mx-lab-route__path",d:"M58 194H96V156H158V94H258"}),i.map(([c,d],m)=>e.jsx("circle",{className:"mx-lab-route__node","data-reached":m<=a,cx:c,cy:d,r:"3"},`${c}-${d}`)),e.jsx("g",{className:"mx-lab-route__marker",style:{transform:`translate(${n}px, ${l}px)`},children:e.jsx("circle",{r:"6"})})]})}),e.jsxs("div",{className:"mx-lab-ref__copy",children:[e.jsxs("small",{children:["Шаг ",a+1," из ",i.length]}),e.jsx("strong",{children:a===i.length-1?"Маршрут собран":"Следующий шаг виден"})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(c=>(c+1)%i.length),"onClick"),children:[a===i.length-1?e.jsx(O,{size:17}):e.jsx(E,{size:17}),a===i.length-1?"Пройти снова":"Сделать шаг"]})]})})}r(Aa,"FibonacciRouteExperiment");function La({mode:s}){const[a,t]=o.useState(!1);return e.jsx(f,{number:"16",eyebrow:"Референс · портал",title:"Следующий шаг открывается",purpose:"Две вертикальные дуги расходятся только после решения начать. Композиция показывает переход к действию без карточки, круга или декоративной сцены.",mode:s,children:e.jsxs("div",{className:"mx-lab-ref mx-lab-gate","data-open":a,children:[e.jsxs("div",{className:"mx-lab-ref__visual mx-lab-gate__visual","aria-hidden":"true",children:[e.jsxs("svg",{viewBox:"0 0 320 252",children:[e.jsxs("g",{className:"mx-lab-ref__guides",children:[e.jsx("path",{d:"M34 126H286"}),e.jsx("path",{d:"M160 22V230"})]}),e.jsxs("g",{className:"mx-lab-gate__side mx-lab-gate__side--left",children:[e.jsx("path",{d:"M56 32C138 58 138 194 56 220"}),e.jsx("path",{d:"M88 52C142 76 142 176 88 200"})]}),e.jsxs("g",{className:"mx-lab-gate__side mx-lab-gate__side--right",children:[e.jsx("path",{d:"M264 32C182 58 182 194 264 220"}),e.jsx("path",{d:"M232 52C178 76 178 176 232 200"})]}),e.jsx("path",{className:"mx-lab-gate__path",d:"M160 70V182"}),e.jsx("circle",{className:"mx-lab-ref__core mx-lab-gate__core",cx:"160",cy:"126",r:"6"})]}),e.jsxs("div",{className:"mx-lab-gate__label",children:[e.jsx("small",{children:a?"Путь открыт":"Ближайшее действие"}),e.jsx("strong",{children:a?"Начать практику":"Записать главную мысль"})]})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(i=>!i),"onClick"),children:[a?e.jsx(Ce,{size:17}):e.jsx(E,{size:17}),a?"Закрыть":"Открыть шаг"]})]})})}r(La,"NextStepGateExperiment");function Ra({mode:s}){const[a,t]=o.useState(0),i=[[48,176],[126,76],[204,176],[274,104]],n=["Начало видно","Первый поворот","Ритм удержан","Шаг завершён"],[l,c]=i[a];return e.jsx(f,{number:"17",eyebrow:"Новый референс маршрута",title:"Путь течёт, а не складывается",purpose:"Альтернатива ступенчатому Fibonacci-маршруту: одна непрерывная нить мягко проводит через четыре действия и сохраняет ощущение движения вперёд.",mode:s,children:e.jsxs("div",{className:"mx-lab-ref mx-lab-flow-route","data-step":a,children:[e.jsx("div",{className:"mx-lab-ref__visual","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 320 252",children:[e.jsxs("g",{className:"mx-lab-ref__guides",children:[e.jsx("path",{d:"M28 126H292"}),e.jsx("path",{d:"M160 26V226"})]}),e.jsx("path",{className:"mx-lab-flow-route__echo",d:"M48 176C88 176 82 76 126 76S166 176 204 176S238 104 274 104"}),e.jsx("path",{className:"mx-lab-flow-route__path",d:"M48 176C88 176 82 76 126 76S166 176 204 176S238 104 274 104"}),i.map(([d,m],x)=>e.jsxs("g",{className:"mx-lab-flow-route__node","data-reached":x<=a,children:[e.jsx("path",{d:`M${d-12} ${m}H${d+12}`}),e.jsx("circle",{cx:d,cy:m,r:"3"})]},`${d}-${m}`)),e.jsx("g",{className:"mx-lab-flow-route__marker",style:{transform:`translate(${l}px, ${c}px)`},children:e.jsx("circle",{r:"6"})})]})}),e.jsxs("div",{className:"mx-lab-ref__copy",children:[e.jsxs("small",{children:["Этап ",a+1," из ",i.length]}),e.jsx("strong",{children:n[a]})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(d=>(d+1)%i.length),"onClick"),children:[a===i.length-1?e.jsx(O,{size:17}):e.jsx(E,{size:17}),a===i.length-1?"Пройти снова":"Следующий этап"]})]})})}r(Ra,"FlowRouteExperiment");function Ia({mode:s}){const[a,t]=o.useState(1),i=["тихий отклик","ровный резонанс","живой импульс"];return e.jsx(f,{number:"18",eyebrow:"Новый референс энергии",title:"Импульс раскрывает крылья",purpose:"Вместо замкнутой мембраны энергия расходится от центральной оси двумя волнами. Чем больше импульс, тем шире пространство действия.",mode:s,children:e.jsxs("div",{className:"mx-lab-ref mx-lab-resonance","data-energy":a,children:[e.jsx("div",{className:"mx-lab-ref__visual","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 320 252",children:[e.jsxs("g",{className:"mx-lab-ref__guides",children:[e.jsx("path",{d:"M30 126H290"}),e.jsx("path",{d:"M160 24V228"})]}),e.jsxs("g",{className:"mx-lab-resonance__wing mx-lab-resonance__wing--left",children:[e.jsx("path",{d:"M156 126C126 94 92 70 42 68C72 104 72 148 42 184C92 182 126 158 156 126Z"}),e.jsx("path",{d:"M146 126C118 108 94 102 70 104C88 126 88 126 70 148C94 150 118 144 146 126Z"})]}),e.jsxs("g",{className:"mx-lab-resonance__wing mx-lab-resonance__wing--right",children:[e.jsx("path",{d:"M164 126C194 94 228 70 278 68C248 104 248 148 278 184C228 182 194 158 164 126Z"}),e.jsx("path",{d:"M174 126C202 108 226 102 250 104C232 126 232 126 250 148C226 150 202 144 174 126Z"})]}),e.jsx("path",{className:"mx-lab-resonance__spine",d:"M160 54V198"}),e.jsx("circle",{className:"mx-lab-ref__core",cx:"160",cy:"126",r:"6"})]})}),e.jsxs("div",{className:"mx-lab-ref__copy",children:[e.jsx("small",{children:"Энергия сейчас"}),e.jsx("strong",{children:i[a]})]}),e.jsx("div",{className:"mx-lab-ref__choices","aria-label":"Уровень энергии",children:i.map((n,l)=>e.jsx("button",{type:"button","aria-label":n,"aria-pressed":a===l,onClick:r(()=>t(l),"onClick"),children:e.jsx("span",{})},n))})]})})}r(Ia,"ResonanceExperiment");function Ta({mode:s}){const[a,t]=o.useState(0),i=[{label:"Стакан воды",meta:"утренний ритуал"},{label:"Главная мысль",meta:"фокус дня"},{label:"Дыхание",meta:"восстановление"},{label:"Тихая прогулка",meta:"практика"}],n=[e.jsxs("svg",{viewBox:"0 0 120 84","aria-hidden":"true",children:[e.jsx("path",{d:"M34 18C38 58 46 70 60 74C74 70 82 58 86 18"}),e.jsx("path",{d:"M34 18C47 13 73 13 86 18C73 23 47 23 34 18Z"}),e.jsx("path",{d:"M39 48C50 43 70 53 81 48"}),e.jsx("circle",{cx:"60",cy:"39",r:"3"})]},"water"),e.jsxs("svg",{viewBox:"0 0 120 84","aria-hidden":"true",children:[e.jsx("path",{d:"M22 58C40 28 80 28 98 58C80 48 40 48 22 58Z"}),e.jsx("path",{d:"M60 22V62"}),e.jsx("path",{d:"M40 34L60 22L80 34"}),e.jsx("circle",{cx:"60",cy:"22",r:"3"})]},"thought"),e.jsxs("svg",{viewBox:"0 0 120 84","aria-hidden":"true",children:[e.jsx("path",{d:"M60 42C46 30 48 15 60 8C72 15 74 30 60 42Z"}),e.jsx("path",{d:"M60 42C74 30 89 32 96 42C89 52 74 54 60 42Z"}),e.jsx("path",{d:"M60 42C74 54 72 69 60 76C48 69 46 54 60 42Z"}),e.jsx("path",{d:"M60 42C46 54 31 52 24 42C31 32 46 30 60 42Z"}),e.jsx("circle",{cx:"60",cy:"42",r:"3"})]},"breath"),e.jsxs("svg",{viewBox:"0 0 120 84","aria-hidden":"true",children:[e.jsx("path",{d:"M16 60C34 60 32 24 50 24S68 60 84 60S98 38 106 38"}),e.jsx("path",{d:"M16 68H106"}),e.jsx("circle",{cx:"50",cy:"24",r:"3"})]},"walk")];return e.jsx(f,{number:"19",eyebrow:"Система смысловых рисунков",title:"У каждой карточки свой знак",purpose:"Принцип стакана воды превращается в систему: рисунок показывает смысл конкретного действия, но остаётся частью единого языка тонких линий Mentalix.",mode:s,children:e.jsxs("div",{className:"mx-lab-atlas",children:[e.jsx("div",{className:"mx-lab-atlas__grid",children:i.map((l,c)=>e.jsxs("button",{type:"button",className:"mx-lab-atlas__card","aria-pressed":a===c,onClick:r(()=>t(c),"onClick"),children:[e.jsx("span",{className:"mx-lab-atlas__mark",children:n[c]}),e.jsx("small",{children:l.meta}),e.jsx("strong",{children:l.label})]},l.label))}),e.jsxs("p",{className:"mx-lab-atlas__note",children:["Выбран знак: ",e.jsx("strong",{children:i[a].label})]})]})})}r(Ta,"SemanticAtlasExperiment");function Da({mode:s}){const[a,t]=o.useState(0),i=[{title:"Утренняя молитва",meta:"намерение перед началом дня",kind:"prayer"},{title:"Холодный душ",meta:"пробуждение через действие",kind:"shower"},{title:"Зачем ты проснулся",meta:"возвращение к смыслу дня",kind:"purpose"}],n=i.map((l,c)=>e.jsx(w,{kind:l.kind,animated:a===c,highlighted:a===c},l.kind));return e.jsx(f,{number:"20",eyebrow:"Ваши ритуалы",title:"Три действия — три собственных знака",purpose:"Каждая карточка буквально переводит смысл ритуала в геометрию. Нажатие выбирает действие и запускает только связанную с ним короткую реакцию формы.",mode:s,children:e.jsx("div",{className:"mx-lab-ritual-cards",children:i.map((l,c)=>e.jsxs("button",{type:"button",className:"mx-lab-ritual-card","data-kind":l.kind,"aria-pressed":a===c,onClick:r(()=>t(c),"onClick"),children:[e.jsx("span",{className:"mx-lab-ritual-card__art",children:n[c]}),e.jsxs("span",{className:"mx-lab-ritual-card__copy",children:[e.jsx("small",{children:a===c?"Выбранный ритуал":"Утренний ритуал"}),e.jsx("strong",{children:l.title}),e.jsx("span",{children:l.meta})]}),e.jsx(E,{size:17,"aria-hidden":"true"})]},l.title))})})}r(Da,"RitualCardsExperiment");function za({mode:s}){const[a,t]=o.useState(0),i=[{title:"Отказ от алкоголя",meta:"ясность вместо привычного импульса",kind:"alcohol"},{title:"Отказ от курения",meta:"свободное дыхание без дыма",kind:"smoking"},{title:"Осознанный отказ",meta:"прямой курс остаётся сильнее бокового импульса",kind:"asceza"}],n=i.map((l,c)=>e.jsx(w,{kind:l.kind,animated:a===c,highlighted:a===c},l.kind));return e.jsx(f,{number:"21",eyebrow:"Ваши аскезы",title:"Отказ тоже получает ясный знак",purpose:"Три карточки показывают не запрет ради запрета, а выбранное направление: линия решения пересекает алкоголь, дым исчезает из разорванной привычки, а общий знак удерживает прямой курс при угасающем боковом импульсе.",mode:s,children:e.jsx("div",{className:"mx-lab-asceza-cards",children:i.map((l,c)=>e.jsxs("button",{type:"button",className:"mx-lab-asceza-card","data-kind":l.kind,"aria-pressed":a===c,onClick:r(()=>t(c),"onClick"),children:[e.jsx("span",{className:"mx-lab-asceza-card__art",children:n[c]}),e.jsxs("span",{className:"mx-lab-asceza-card__copy",children:[e.jsx("small",{children:a===c?"Выбранная аскеза":"Личная аскеза"}),e.jsx("strong",{children:l.title}),e.jsx("span",{children:l.meta})]}),e.jsx(E,{size:17,"aria-hidden":"true"})]},l.title))})})}r(za,"AscezaCardsExperiment");function $a({item:s,selected:a,onSelect:t}){return e.jsxs("button",{type:"button",className:"mx-lab-system-card","data-kind":s.kind,"aria-pressed":a,onClick:t,children:[e.jsx("span",{className:"mx-lab-system-card__art",children:e.jsx(w,{kind:s.kind,animated:a,highlighted:a})}),e.jsxs("span",{className:"mx-lab-system-card__copy",children:[e.jsx("small",{children:a?s.activeLabel:s.label}),e.jsx("strong",{children:s.title}),e.jsx("span",{children:s.meta})]})]})}r($a,"SemanticSystemCard");function Pe({items:s}){const[a,t]=o.useState(0);return e.jsx("div",{className:"mx-lab-system-grid","data-count":s.length,children:s.map((i,n)=>e.jsx($a,{item:i,selected:a===n,onSelect:r(()=>t(n),"onSelect")},i.title))})}r(Pe,"SemanticSystemGrid");function Oa({mode:s}){const a=[{title:"Нейротренажёр",meta:"связи собираются в один ясный маршрут",kind:"neuro",label:"тренировка связи",activeLabel:"связь активна"},{title:"Дыхание",meta:"две доли освобождают место для вдоха",kind:"breath",label:"практика дыхания",activeLabel:"идёт вдох"},{title:"Фокус",meta:"поле сужается до выбранной точки",kind:"focus",label:"инструмент внимания",activeLabel:"фокус найден"},{title:"Медитация",meta:"внутренние волны возвращаются к тишине",kind:"meditation",label:"практика тишины",activeLabel:"внимание осело"}];return e.jsx(f,{number:"22",eyebrow:"Практики Mentalix",title:"У каждого инструмента — собственная работа формы",purpose:"Не набор абстрактных кругов, а четыре понятных процесса: нейронная связь собирается, дыхание раскрывается, оптика фокуса сужается, а волны медитации оседают. Нажмите на карточку, чтобы увидеть её смысловое состояние.",mode:s,children:e.jsx(Pe,{items:a})})}r(Oa,"PracticeSystemExperiment");function Ba({mode:s}){const a=[{title:"Наставник",meta:"помогает сверить направление",kind:"mentor",label:"роль проводника",activeLabel:"курс выстроен"},{title:"Собеседник",meta:"слышит и возвращает мысль яснее",kind:"companion",label:"роль диалога",activeLabel:"контакт установлен"},{title:"Следопыт",meta:"показывает следующий достижимый след",kind:"pathfinder",label:"роль маршрута",activeLabel:"след найден"}];return e.jsx(f,{number:"23",eyebrow:"Раздел наставника",title:"Три роли говорят разной геометрией",purpose:"Наставник выстраивает курс, Собеседник соединяет две стороны разговора, Следопыт проводит живую точку к следующему следу. Так роль считывается ещё до текста и не превращается в безымянную декоративную иконку.",mode:s,children:e.jsx(Pe,{items:a})})}r(Ba,"MentorSystemExperiment");function Ha({mode:s}){const a=[{title:"Тревога",meta:"распутать напряжение до ровной опоры",kind:"anxiety",label:"тема состояния",activeLabel:"контур распутан"},{title:"Сон",meta:"закрыть внешний контур и отпустить день",kind:"sleep",label:"тема восстановления",activeLabel:"контур закрыт"},{title:"Новая тема",meta:"каркас для будущей функции или статьи",kind:"template",label:"расширяемая система",activeLabel:"смысл собран"}];return e.jsx(f,{number:"24",eyebrow:"Статьи и новые функции",title:"Тема получает знак из своего внутреннего действия",purpose:"Тревога распутывается в опору, сон мягко закрывает внешний контур, а модульная рамка показывает правило для будущих тем: сначала определяется смысл действия, затем вокруг него строится уникальная геометрия.",mode:s,children:e.jsx(Pe,{items:a})})}r(Ha,"ArticleSystemExperiment");function Ua({mode:s}){const[a,t]=o.useState(0);return e.jsx(f,{number:"25",eyebrow:"Askeza / Ritual · «Мой путь»",title:"Путь нарисован сразу — движется точка, а не линия",purpose:"Линии показаны сразу полностью и статично — путь уже существует. Акцентная точка едет по готовому маршруту, и тонкий золотой оверлей растёт следом за ней до её текущей позиции: «иду по пути», а не «путь рисуется».",mode:s,children:e.jsxs("div",{className:"mx-lab-my-path",children:[e.jsx("div",{style:{display:"flex",justifyContent:"center"},children:e.jsx("div",{style:{width:"180px"},children:e.jsx(ce,{animated:s==="after"},`progress-${a}`)})}),e.jsxs("div",{style:{marginTop:"2rem",paddingTop:"2rem",borderTop:"1px solid rgba(var(--c-line), 0.16)"},children:[e.jsx("p",{style:{fontSize:"0.8rem",opacity:.68,textAlign:"center",marginBottom:"1rem"},children:"Акцентный цвет — вариант для сравнения (закреплён в PR #143)"}),e.jsxs("div",{style:{display:"flex",gap:"2rem",justifyContent:"center"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"},children:[e.jsx(ce,{animated:s==="after"},`primary-${a}`),e.jsx("small",{style:{opacity:.68},children:"Основной (золото)"})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"},children:[e.jsx(ce,{animated:s==="after",accent:"secondary"},`secondary-${a}`),e.jsx("small",{style:{opacity:.68},children:"Вариант (#C77D7A)"})]})]})]}),e.jsxs("div",{className:"mx-lab-my-path__copy",children:[e.jsx("small",{children:"Пилот · только ui-lab"}),e.jsx("strong",{children:"Мой путь"}),e.jsx("span",{children:"В прод не деплоится — карточка ждёт отдельного решения о переносе в Askeza/Ritual."})]}),e.jsxs("button",{type:"button",className:"mx-lab-primary",onClick:r(()=>t(i=>i+1),"onClick"),children:[e.jsx(O,{size:17}),"Проиграть снова"]})]})})}r(Ua,"MyPathCardExperiment");function Fa({mode:s}){const[a,t]=o.useState(0),i=[{title:"Стакан воды",kind:"ritual",variant:"primary"},{title:"Стакан воды",kind:"ritual",variant:"secondary"},{title:"Аскеза",kind:"asceza",variant:"primary"},{title:"Аскеза",kind:"asceza",variant:"secondary"}];return e.jsx(f,{number:"26",eyebrow:"Стиль Ritual & Askeza",title:"Два цветовых варианта для различения категорий",purpose:"Золотой акцент (основной) для Askeza/Ritual. Медный/лиловый акцент (вариант) для будущих категорий (например, Наставник). Оба варианта показаны рядом. Не деплоится в прод — только в ui-lab (при ?ui_lab=1).",mode:s,children:e.jsx("div",{className:"mx-lab-styles-comparison",style:{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:"2rem"},children:i.map((n,l)=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"1.5rem",borderRadius:"0.75rem",border:"1px solid rgba(var(--c-line), 0.24)",cursor:"pointer"},onClick:r(()=>t(l),"onClick"),onKeyDown:r(c=>{(c.key==="Enter"||c.key===" ")&&t(l)},"onKeyDown"),role:"button",tabIndex:0,children:[e.jsx("div",{style:{width:"80px",height:"80px"},children:e.jsx(w,{kind:n.kind,animated:a===l,highlighted:a===l,accent:n.variant==="secondary"?"secondary":void 0})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("small",{style:{opacity:.68},children:n.variant==="primary"?"Основной":"Вариант"}),e.jsx("strong",{style:{display:"block"},children:n.title}),e.jsx("span",{style:{fontSize:"0.875rem",opacity:.56},children:n.kind})]})]},`${n.kind}-${n.variant}`))})})}r(Fa,"RitualAscezaStylesExperiment");function Ga({embedded:s=!1}){const[a,t]=o.useState("after");return o.useEffect(()=>{const i=window.location.hash.slice(1);if(!i)return;const n=window.requestAnimationFrame(()=>{const l=document.getElementById(i);l&&(l.scrollIntoView({behavior:"smooth",block:"start"}),l.dataset.highlight="true",window.setTimeout(()=>delete l.dataset.highlight,1800))});return()=>window.cancelAnimationFrame(n)},[]),e.jsxs("main",{className:"mx-lab","data-mode":a,children:[!s&&e.jsxs("header",{className:"mx-lab-header",children:[e.jsx("div",{className:"mx-lab-header__mark","aria-hidden":"true",children:e.jsx("span",{})}),e.jsx("p",{className:"mx-lab-kicker",children:"Mentalix · лаборатория интерфейса"}),e.jsx(_s,{active:"experiments"}),e.jsx("h1",{children:"Движение, которое помогает сделать шаг."}),e.jsx("p",{className:"mx-lab-intro",children:"Двадцать пять изолированных прототипов. Они не меняют продуктовые данные и доступны только в режиме разработки."}),e.jsxs("div",{className:"mx-lab-toggle",role:"group","aria-label":"Сравнение вариантов",children:[e.jsx("span",{className:"mx-lab-toggle__indicator","data-side":a,"aria-hidden":"true"}),e.jsx("button",{type:"button","aria-pressed":a==="before",onClick:r(()=>t("before"),"onClick"),children:"Текущий"}),e.jsx("button",{type:"button","aria-pressed":a==="after",onClick:r(()=>t("after"),"onClick"),children:"Эксперимент"})]}),e.jsx("p",{className:"mx-lab-mode-note","aria-live":"polite",children:a==="after"?"Анимация объясняет состояние и подтверждает действие.":"Состояния переключаются без пространственного и тактильного контекста."})]}),!s&&e.jsx(ba,{mode:a}),e.jsxs("div",{className:"mx-lab-list",children:[e.jsx(ja,{mode:a}),e.jsx(_a,{mode:a}),e.jsx(ga,{mode:a}),e.jsx(ya,{mode:a}),e.jsx(va,{mode:a}),e.jsx(fa,{mode:a}),e.jsx(Na,{mode:a}),e.jsx(wa,{mode:a}),e.jsx(Ca,{mode:a}),e.jsx(ka,{mode:a}),e.jsx(Sa,{mode:a}),e.jsx(Ea,{mode:a}),e.jsx(Ma,{mode:a}),e.jsx(Pa,{mode:a}),e.jsx(Aa,{mode:a}),e.jsx(La,{mode:a}),e.jsx(Ra,{mode:a}),e.jsx(Ia,{mode:a}),e.jsx(Ta,{mode:a}),e.jsx(Da,{mode:a}),e.jsx(za,{mode:a}),e.jsx(Oa,{mode:a}),e.jsx(Ba,{mode:a}),e.jsx(Ha,{mode:a}),e.jsx(Ua,{mode:a}),e.jsx(Fa,{mode:a})]}),e.jsxs("footer",{className:"mx-lab-footer",children:[e.jsx("span",{}),"Прототипы не подключены к API",e.jsx("span",{})]})]})}r(Ga,"UiExperiments");const W={rituals:[{id:"ui-lab-ritual-1",name:"Один честный шаг",today_level:null},{id:"ui-lab-ritual-2",name:"Пять минут внимания",today_level:null}],ascezas:[{id:"ui-lab-asceza-1",name:"Не ускоряться",today_status:null}],quote:{text:"Не всё нужно решить сегодня."},themes:[{id:"ui-lab-theme-1",title:"спокойная ясность",subtitle:"Замечать главное без лишнего давления.",total_days:7,reflected_days:3,is_current:!0}],settings:{review_hour:Ms}},oe={mood:3,emotion:"ровно",review_completed_at:null},gs={id:"ui-lab-fixture-user"};function Va(s,a){if(!a||!a.trim())return s;const[t,...i]=s.rituals;return{...s,rituals:[{...t,name:a.trim()},...i]}}r(Va,"withMainRitualName");function ys(s,{mainRitualName:a}={}){let t={...W,checkin:oe};return s==="checkinPending"&&(t={...W,checkin:null}),s==="reviewPending"&&(t={...W,checkin:oe,settings:{review_hour:0}}),s==="dayClosed"&&(t={...W,checkin:{...oe,review_completed_at:"2026-09-02T08:00:00.000Z"},settings:{review_hour:0}}),Va(t,a)}r(ys,"getTodayLabFixture");const ye=[{key:"checkinPending",label:"Чек-ин",eyebrow:"Состояние дня",title:"Сначала понять, как ты сегодня",description:"Коротко зафиксируй состояние, чтобы выбрать бережный первый шаг.",cta:"Начать чек-ин",glyph:"journal",dayArc:{state:"empty",done:0,total:3},context:"утренний вход"},{key:"dayInProgress",label:"В процессе",eyebrow:"Один следующий шаг",title:"Записать главную мысль",description:"Один небольшой шаг, который поддерживает то, что сейчас важно.",cta:"Начать",glyph:"next-step",dayArc:{state:"dayInProgress",done:1,total:3},context:"ритуал · 5 минут"},{key:"reviewPending",label:"Разбор",eyebrow:"Сверить день",title:"Что получилось заметить и сделать?",description:"Сопоставь план и фактический результат без отчётности и оценки.",cta:"Разобрать день",glyph:"release",dayArc:{state:"reviewPending",done:3,total:3},context:"вечерний разбор"},{key:"dayClosed",label:"Завершён",eyebrow:"День завершён",title:"Оставить вывод и увидеть завтрашний шаг",description:"Сегодня уже завершён. Спокойно сохрани главное и вернись завтра.",cta:"Посмотреть завтрашний шаг",glyph:"finish",dayArc:{state:"dayClosed",done:3,total:3},context:"итог дня"}];function Za({value:s,onChange:a}){return e.jsx("div",{className:"mx-lab-state-picker",role:"tablist","aria-label":"Состояние Today",children:ye.map(t=>e.jsx("button",{type:"button",role:"tab","aria-selected":s===t.key,"data-active":s===t.key,onClick:r(()=>a(t.key),"onClick"),children:t.label},t.key))})}r(Za,"StatePicker");function de({state:s}){return e.jsx("div",{className:"mx-lab-today-baseline","data-state":s.key,children:e.jsx(is,{user:gs,previewFixture:ys(s.key),previewState:s.key,onOpenPractice:r(()=>{},"onOpenPractice"),onGoMentor:r(()=>{},"onGoMentor"),onFlowChange:r(()=>{},"onFlowChange")},s.key)})}r(de,"BaselineToday");const Xa=430;function $e({children:s}){const a=o.useRef(null),t=o.useRef(null),[i,n]=o.useState({scale:1,height:0});return o.useLayoutEffect(()=>{const l=a.current,c=t.current;if(!l||!c)return;const d=r(()=>{const x=Math.min(1,l.clientWidth/Xa),h=c.scrollHeight*x;n(u=>u.scale===x&&u.height===h?u:{scale:x,height:h})},"updateMetrics");d();const m=new ResizeObserver(d);return m.observe(l),m.observe(c),()=>m.disconnect()},[]),e.jsx("div",{ref:a,className:"mx-lab-compare-screen-frame",style:{height:i.height?`${i.height}px`:void 0},children:e.jsx("div",{ref:t,className:"mx-lab-compare-screen",style:{transform:`scale(${i.scale})`},children:s})})}r($e,"ScaledCompareScreen");function me({state:s}){return e.jsxs("div",{className:"mx-lab-today-experiment","data-state":s.key,children:[e.jsx("div",{className:"mx-lab-experiment-art","aria-hidden":"true",children:e.jsx(w,{kind:s.glyph,animated:!0,highlighted:!0})}),e.jsx("small",{children:s.eyebrow}),e.jsx("h3",{children:s.title}),e.jsx("p",{children:s.description}),e.jsxs("button",{type:"button",className:"mx-lab-experiment-cta",children:[s.cta,e.jsx(E,{size:16})]}),e.jsx("span",{children:s.context})]})}r(me,"ExperimentToday");function xe({mode:s="experiments",selectedState:a="checkinPending",onStateChange:t}){const i=ye.find(d=>d.key===a)||ye[0],n=t||(()=>{}),[l,c]=o.useState("side-by-side");return e.jsxs("section",{className:"mx-lab-today-route","aria-labelledby":"today-preview-title",children:[e.jsxs("div",{className:"mx-lab-route-heading",children:[e.jsx("span",{children:"Первый собранный маршрут"}),e.jsx("h2",{id:"today-preview-title",children:"Today · четыре состояния"}),e.jsx("p",{children:"Одна фикстура состояния применяется к production-компоненту эталона и эксперименту. API не подключен."})]}),e.jsx(Za,{value:i.key,onChange:n}),s==="baseline"&&e.jsx(de,{state:i}),s==="experiments"&&e.jsx(me,{state:i}),s==="compare"&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"mx-lab-compare-mode",role:"tablist","aria-label":"Режим сравнения",children:[["side-by-side","Рядом"],["sequential","По очереди"]].map(([d,m])=>e.jsx("button",{type:"button",role:"tab","aria-selected":l===d,"data-active":l===d,onClick:r(()=>c(d),"onClick"),children:m},d))}),e.jsx("p",{className:"mx-lab-compare-mode-help",children:l==="side-by-side"?"Компактный обзор двух версий одновременно.":"Полный вертикальный просмотр каждой версии."}),e.jsxs("div",{className:"mx-lab-compare-grid","data-layout":l,children:[e.jsxs("article",{children:[e.jsxs("header",{children:[e.jsx("strong",{children:"Эталон"}),e.jsx("span",{children:"из текущего main"})]}),l==="side-by-side"?e.jsx($e,{children:e.jsx(de,{state:i})}):e.jsx(de,{state:i})]}),e.jsxs("article",{children:[e.jsxs("header",{children:[e.jsx("strong",{children:"Эксперимент"}),e.jsx("span",{children:"Preview-only гипотеза"})]}),l==="side-by-side"?e.jsx($e,{children:e.jsx(me,{state:i})}):e.jsx(me,{state:i})]})]})]})]})}r(xe,"TodayStatePreview");const Wa=[{kind:"breath",title:"Дыхание",description:"вернуться в ровный ритм",meta:"1 минута"},{kind:"focus",title:"Фокус",description:"собрать внимание в одну точку",meta:"25 минут"},{kind:"anxiety",title:"Эмоции",description:"заметить, что происходит внутри",meta:"2 минуты"},{kind:"journal",title:"Рефлексия",description:"назвать главное за сегодня",meta:"5 минут"},{kind:"companion",title:"Отношения",description:"услышать себя и другого",meta:"3 минуты"},{kind:"meditation",title:"Медитация",description:"побыть с тем, что есть",meta:"5 минут"}],ve=60,fe=[{key:"inhale",label:"вдох",seconds:4},{key:"pause",label:"пауза",seconds:2},{key:"exhale",label:"выдох",seconds:6},{key:"rest",label:"пауза",seconds:2}],qa=fe.reduce((s,a)=>s+a.seconds,0);function Ka(){return e.jsx("nav",{className:"mx-practice-catalog__nav","aria-label":"Навигация Preview-карточки",children:["Сегодня","Практики","Наставник","Библиотека","Тренды"].map(s=>e.jsx("span",{"data-active":s==="Практики",children:s},s))})}r(Ka,"PreviewNavigation");function Ja({onClick:s,label:a="Назад к практикам"}){return e.jsxs("button",{type:"button",className:"mx-practice-flow__back",onClick:s,children:[e.jsx("span",{"aria-hidden":"true",children:"←"}),a]})}r(Ja,"FlowBack$1");function Ya({onBack:s,onStart:a}){return e.jsxs("section",{className:"mx-practice-flow","aria-labelledby":"practice-flow-title",children:[e.jsx(Ja,{onClick:s}),e.jsxs("div",{className:"mx-practice-flow__intro",children:[e.jsx("span",{className:"mx-practice-flow__eyebrow",children:"Практика · 1 минута"}),e.jsx("h2",{id:"practice-flow-title",children:"Дыхание"}),e.jsx("p",{children:"Мягкий ритм помогает на минуту отойти от шума и заметить, как ты сейчас."}),e.jsx("div",{className:"mx-practice-flow__hero","aria-hidden":"true",children:e.jsx(w,{kind:"breath",animated:!1,highlighted:!1})}),e.jsxs("button",{type:"button",className:"mx-practice-flow__primary",onClick:a,children:["Начать",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})]})}r(Ya,"PracticeIntro");function Qa(s){const a=s%qa;let t=0;for(const i of fe)if(t+=i.seconds,a<t)return i;return fe[0]}r(Qa,"getBreathPhase");function et({elapsed:s,onExit:a,onFinish:t}){const i=Qa(s),n=Math.min(100,s/ve*100),l=Math.max(0,ve-Math.floor(s));return e.jsxs("section",{className:"mx-practice-flow mx-practice-flow--run","aria-labelledby":"practice-run-title",children:[e.jsxs("div",{className:"mx-practice-flow__run-top",children:[e.jsx("span",{children:"Дыхание"}),e.jsx("button",{type:"button",onClick:a,"aria-label":"Выйти из практики",children:"Выйти"})]}),e.jsx("div",{className:"mx-practice-flow__progress","aria-label":`${l} секунд осталось`,children:e.jsx("span",{style:{width:`${n}%`}})}),e.jsxs("div",{className:"mx-practice-flow__run-center",children:[e.jsxs("div",{className:"mx-practice-flow__breath-art","data-phase":i.key,"aria-hidden":"true",children:[e.jsx(w,{kind:"breath",animated:!1,highlighted:!1}),e.jsx("span",{})]}),e.jsx("h2",{id:"practice-run-title",children:i.label}),e.jsxs("span",{className:"mx-practice-flow__remaining",children:[l," сек"]})]}),e.jsx("button",{type:"button",className:"mx-practice-flow__finish",onClick:t,children:"Завершить"})]})}r(et,"PracticeRun");function st({onContinue:s}){const[a,t]=o.useState(""),i=["тише","ровнее","пока так же"];return e.jsxs("section",{className:"mx-practice-flow mx-practice-flow--done","aria-labelledby":"practice-done-title",children:[e.jsx("div",{className:"mx-practice-flow__done-mark","aria-hidden":"true",children:e.jsx(w,{kind:"breath",animated:!1,highlighted:!1})}),e.jsx("span",{className:"mx-practice-flow__eyebrow",children:"Минута завершена"}),e.jsx("h2",{id:"practice-done-title",children:"Ты вернулся к дыханию"}),e.jsx("p",{children:"Что изменилось в твоём состоянии?"}),e.jsx("div",{className:"mx-practice-flow__answers",role:"radiogroup","aria-label":"Изменение состояния",children:i.map(n=>e.jsx("button",{type:"button",role:"radio","aria-checked":a===n,"data-selected":a===n,onClick:r(()=>t(n),"onClick"),children:n},n))}),e.jsxs("button",{type:"button",className:"mx-practice-flow__primary",onClick:s,children:["Продолжить",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(st,"PracticeDone");function at(){const s=o.useRef(null),[a,t]=o.useState("catalog"),[i,n]=o.useState(0);o.useEffect(()=>{if(a!=="run")return;const c=Date.now(),d=window.setInterval(()=>{const m=(Date.now()-c)/1e3;n(m),m>=ve&&t("done")},200);return()=>window.clearInterval(d)},[a]);function l(){n(0),t("run")}return r(l,"startPractice"),a==="intro"?e.jsx(Ya,{onBack:r(()=>t("catalog"),"onBack"),onStart:l}):a==="run"?e.jsx(et,{elapsed:i,onExit:r(()=>t("catalog"),"onExit"),onFinish:r(()=>t("done"),"onFinish")}):a==="done"?e.jsx(st,{onContinue:r(()=>t("catalog"),"onContinue")}):e.jsxs("section",{className:"mx-practice-catalog","aria-labelledby":"practice-catalog-title",children:[e.jsxs("div",{className:"mx-practice-catalog__head",children:[e.jsx("span",{children:"Практики · Preview-only"}),e.jsx("h2",{id:"practice-catalog-title",children:"Шесть способов вернуться к себе"}),e.jsx("p",{children:"Две крупные карточки остаются в поле зрения, а следующий ряд мягко выглядывает справа."})]}),e.jsxs("div",{className:"mx-practice-catalog__frame",children:[e.jsx("div",{ref:s,className:"mx-practice-catalog__rail","aria-label":"Каталог практик. Проведи в сторону, чтобы увидеть следующие карточки.",children:Wa.map(c=>e.jsxs("button",{className:"mx-practice-catalog__card",type:"button",onClick:c.title==="Дыхание"?()=>t("intro"):void 0,children:[e.jsx("span",{className:"mx-practice-catalog__art","aria-hidden":"true",children:e.jsx(w,{kind:c.kind,animated:!1,highlighted:!1})}),e.jsxs("span",{className:"mx-practice-catalog__copy",children:[e.jsx("span",{className:"mx-practice-catalog__meta",children:c.meta}),e.jsx("strong",{children:c.title}),e.jsx("span",{children:c.description})]})]},c.title))}),e.jsx(Ka,{})]})]})}r(at,"PracticeCatalogExperiment");const tt=[{title:"Медитация",subtitle:"заметить своё и выбрать один спокойный шаг",kind:"meditation"},{title:"Ритуалы",subtitle:"обряды, что держат твой день",kind:"ritual"},{title:"Аскезы",subtitle:"от чего ты отказываешься",kind:"asceza"},{title:"Первый шаг",subtitle:"маленький шаг, когда трудно начать",kind:"next-step"},{title:"Без вины",subtitle:"когда откладываешь и знаешь это",kind:"release"},{title:"Один финиш",subtitle:"маленький кусок, доведённый до конца",kind:"finish"}];function Oe(){return e.jsxs("section",{className:"mx-practice-baseline","aria-labelledby":"practice-baseline-title",children:[e.jsx("div",{className:"mx-practice-baseline__label",children:"Эталон · production"}),e.jsx("h2",{id:"practice-baseline-title",children:"практики."}),e.jsx("p",{className:"mx-practice-baseline__note",children:"Текущий прод-экран: вертикальные категории и последовательный список практик."}),e.jsx("div",{className:"mx-practice-baseline__journal",children:"Запись дня · Открыть журнал"}),["Практики","Психологические практики","Дальше / Скоро"].map((s,a)=>e.jsxs("div",{className:"mx-practice-baseline__category",children:[e.jsx("h3",{children:s}),tt.slice(a*2,a*2+2).map(t=>e.jsxs("button",{className:"mx-practice-baseline__row",type:"button",children:[e.jsx("span",{className:"mx-practice-baseline__art","aria-hidden":"true",children:e.jsx(w,{kind:t.kind,animated:!1,highlighted:!1})}),e.jsxs("span",{children:[e.jsx("strong",{children:t.title}),e.jsx("small",{children:t.subtitle})]}),e.jsx("span",{className:"mx-practice-baseline__chevron","aria-hidden":"true",children:"›"})]},t.title))]},s))]})}r(Oe,"ProductionBaseline");const L=[{key:"idea",label:"Идея",title:"Что сейчас занимает мои мысли?",hint:"Запиши это так, как оно есть. Без правильного ответа."},{key:"action",label:"Действие",title:"Что из этого зависит от меня сегодня?",hint:"Выбери один небольшой шаг, который можно проверить."},{key:"analysis",label:"Анализ",title:"Что произошло и что я заметил?",hint:"Посмотри на день без обвинений и без необходимости всё объяснить."},{key:"newStep",label:"Новый шаг",title:"Что я возьму с собой дальше?",hint:"Сформулируй одно продолжение, а не большой план."}];function Be(s){var l;const a=Rs(cs(),s),t=Object.fromEntries(L.map(({key:c})=>{var d;return[c,((d=a.cycle[c])==null?void 0:d.text)||""]})),i=L.findIndex(({key:c})=>!t[c].trim());return{complete:((l=a.cycle.newStep)==null?void 0:l.status)==="final"&&L.every(({key:c})=>t[c].trim()),drafts:t,phaseIndex:i===-1?L.length-1:i}}r(Be,"readSaved");function He(){return"Не удалось сохранить запись на этом устройстве. Текст остаётся на экране — попробуй ещё раз после проверки места в браузере."}r(He,"storageErrorMessage");function Ae({onClick:s}){return e.jsx("div",{className:`${Is} journal-flow__topbar`,children:e.jsx(Ts,{onClick:s})})}r(Ae,"FlowBack");function rt({completed:s,legacyVisible:a,storageError:t,onStart:i,onMigrate:n,onDismissLegacy:l,onOpenGuided:c,onClose:d}){const m=s===L.length,x=s>0&&!m,h=m?"Сегодняшняя запись сохранена":x?"Продолжи спокойный разговор с собой":"Разложи день на четыре спокойных шага",u=m?"Все четыре шага уже сохранены. Можно перечитать запись или вернуться к практикам.":x?`Уже заполнено ${s} из 4 шагов. Черновик ждёт здесь.`:"Идея, действие, анализ и следующий шаг. Не дневник «на оценку», а место, чтобы заметить главное.";return e.jsxs(e.Fragment,{children:[e.jsx(Ae,{onClick:d}),e.jsxs("main",{className:`journal-flow__intro${m?" journal-flow__intro--completed":""}`,children:[e.jsx("div",{className:"journal-flow__hero","aria-hidden":"true",children:e.jsx(Se,{})}),e.jsxs("div",{className:"journal-flow__intro-copy",children:[e.jsx("p",{className:"text-[11px] font-bold uppercase tracking-[0.14em] text-gold",children:"Журнал"}),e.jsx("h1",{className:"journal-flow__intro-title font-display text-cream",children:h}),e.jsx("p",{className:"journal-flow__intro-description",children:u}),e.jsx("p",{className:"journal-flow__intro-note",children:"Ответы остаются на этом устройстве. Можно остановиться в любой момент."}),c&&e.jsx("button",{type:"button",onClick:c,className:"journal-flow__guided-action",children:"Разобраться в ситуации →"})]}),a&&e.jsxs("div",{className:"journal-flow__legacy",role:"status",children:[e.jsx("p",{children:"На этом устройстве есть запись старого формата."}),e.jsx("span",{children:"Она не была привязана к профилю. Переноси её, только если это твоя запись."}),e.jsxs("div",{children:[e.jsx("button",{type:"button",onClick:n,children:"Перенести"}),e.jsx("button",{type:"button",onClick:l,children:"Не сейчас"})]})]}),t&&e.jsx("p",{className:"journal-flow__error",role:"alert",children:t}),e.jsx("div",{className:"journal-flow__intro-actions",children:e.jsx("button",{type:"button",onClick:i,className:`journal-flow__intro-cta${m?" journal-flow__intro-cta--completed":""}`,"aria-label":m?"Открыть запись":x?"Продолжить":"Начать",children:m?"Открыть запись":x?"Продолжить":"Начать"})})]})]})}r(rt,"JournalIntro");function it({onClose:s,onOpen:a}){return e.jsxs(e.Fragment,{children:[e.jsx(Ae,{onClick:s}),e.jsxs("main",{className:"journal-flow__completion",children:[e.jsx("div",{className:"journal-flow__completion-art","aria-hidden":"true",children:e.jsx(Se,{})}),e.jsxs("div",{className:"journal-flow__completion-copy",children:[e.jsx("p",{className:"text-[11px] font-bold uppercase tracking-[0.14em] text-gold",children:"Запись сохранена"}),e.jsx("h1",{className:"journal-flow__completion-title font-display text-cream",children:"Цикл сохранён"}),e.jsx("p",{className:"journal-flow__completion-description",children:"Идея, действие, анализ и следующий шаг останутся в твоём журнале на этом устройстве."})]}),e.jsxs("div",{className:"journal-flow__completion-actions",children:[e.jsx("button",{type:"button",onClick:s,className:"cta-pill journal-flow__completion-primary",children:"Вернуться к практикам"}),e.jsx("button",{type:"button",onClick:a,className:"journal-flow__completion-secondary",children:"Открыть запись"})]})]})]})}r(it,"JournalComplete");function nt({userId:s,onClose:a,onOpenGuided:t}){const{style:i}=ns(),[n]=o.useState(()=>Be(s)),[l,c]=o.useState("intro"),[d,m]=o.useState(n.complete),[x,h]=o.useState(n.phaseIndex),[u,p]=o.useState(n.drafts),[v,y]=o.useState(null),[C,A]=o.useState(()=>Ps(s)),b=L[x],_=u[b.key]||"",g=L.filter(({key:k})=>{var P;return(P=u[k])==null?void 0:P.trim()}).length,S=x===L.length-1;function V({text:k,status:P="draft"}){try{return Ds({date:cs(),phase:b.key,text:k,status:P,userId:s}),y(null),!0}catch(D){return console.error(D),y(He()),T.haptic("error"),!1}}r(V,"persistPhase");function se(k){p(P=>({...P,[b.key]:k})),V({text:k,status:S&&d?"final":"draft"})}r(se,"updateValue");function ae(){if(_.trim()&&V({text:_,status:S?"final":"draft"})){if(T.haptic(S?"success":"light"),S){m(!0),c("complete");return}h(k=>k+1)}}r(ae,"continueFlow");function te(){if(l==="writing"&&x>0){T.haptic("light"),h(k=>k-1);return}if(l==="writing"){T.haptic("light"),c("intro");return}a()}r(te,"goBack");function re(){const k=L.findIndex(P=>{var D;return!((D=u[P.key])!=null&&D.trim())});h(k===-1?L.length-1:k),y(null),T.haptic("light"),c("writing")}r(re,"start");function ie(){try{if(Ls(s)){const P=Be(s);p(P.drafts),m(P.complete),h(P.phaseIndex)}y(null),A(!1),T.haptic("success")}catch(k){console.error(k),y(He()),T.haptic("error")}}return r(ie,"migrateLegacyEntry"),bs.createPortal(e.jsxs("div",{className:`${As} mx-practice-flow mx-practice-flow--journal flex flex-col`,style:i,children:[l==="intro"&&e.jsx(rt,{completed:g,legacyVisible:C,storageError:v,onStart:re,onMigrate:ie,onDismissLegacy:r(()=>A(!1),"onDismissLegacy"),onOpenGuided:t,onClose:a}),l==="writing"&&b&&e.jsxs(e.Fragment,{children:[e.jsx(Ae,{onClick:te}),e.jsx(Qs,{value:_,onChange:se,question:b.title,description:b.hint,placeholder:"Начни писать...",ariaLabel:`${b.label}: ${b.title}`,autoFocus:!0,onSubmit:ae,submitLabel:S?"Сохранить и завершить":"Сохранить и продолжить",submitDisabled:!_.trim(),className:"journal-flow__writing min-h-0 flex-1"}),v&&e.jsx("p",{className:"journal-flow__writing-error",role:"alert",children:v})]}),l==="complete"&&e.jsx(it,{onClose:a,onOpen:r(()=>{h(L.length-1),c("writing")},"onOpen")})]}),ls())}r(nt,"JournalFlow");const Ue={rituals:[{id:"demo-ritual-1",name:"Утренний вопрос",today_level:!0},{id:"demo-ritual-2",name:"Десять минут тишины",today_level:!1},{id:"demo-ritual-3",name:"Закрыть день",today_level:!1}],ascezas:[{id:"demo-asceza-1",name:"Без телефона за столом",today_status:"held"},{id:"demo-asceza-2",name:"Не открывать ленту до завтрака",today_status:null}],themes:[{id:"demo-theme-1",slug:"demo-less-effort",title:"Один вопрос.",subtitle:"Тема недели:",current_day:1,reflected_days:2,started:!0,is_current:!0,questions:[{id:"demo-question-1",question:"Что сегодня можно сделать с меньшим усилием?",explanation:"Заметь, где достаточно одного простого шага."},{id:"demo-question-2",question:"Что ты продолжаешь тащить по привычке?",explanation:"Проверь, действительно ли это всё ещё необходимо."},{id:"demo-question-3",question:"Где можно попросить о поддержке?",explanation:"Не всё обязательно удерживать в одиночку."},{id:"demo-question-4",question:"Что поможет завершить неделю чуть легче?",explanation:"Выбери один шаг, который освободит внимание."}]}]},lt=["first-step"];function ct(s){const[a,t]=o.useState(s?{rituals:[],ascezas:[],themes:[]}:Ue),[i,n]=o.useState(s?"loading":"demo"),[l,c]=o.useState(null);async function d(){if(!(s!=null&&s.id)){t(Ue),n("demo");return}n("loading"),c(null);try{const[m,x,h]=await Promise.all([le.rituals.list(s.id),le.ascezas.list(s.id),le.themes.list(s.id)]);t({rituals:Array.isArray(m)?m:[],ascezas:Array.isArray(x)?x:[],themes:Array.isArray(h)?h:[]}),n("ready")}catch(m){c(m),n("error")}}return r(d,"load"),o.useEffect(()=>{d()},[s==null?void 0:s.id]),{...a,status:i,error:l,reload:d}}r(ct,"usePreviewData");function Le({kind:s,highlighted:a=!1}){return e.jsx(w,{kind:s,animated:!1,highlighted:a})}r(Le,"PracticeGlyph");function ot({practices:s,onOpen:a}){const i=[{key:"lila-discover",title:"Разобраться со Следопытом",category:"Следопыт",description:"Карта, несколько вопросов и один рабочий шаг",status:"НОВОЕ",kind:"journal",active:!0,practice:os(s,"lila-discover")||{key:"lila-discover",title:"Разобраться со Следопытом",subtitle:"Карта, несколько вопросов и один рабочий шаг",kind:"journal",sub:"lila-discover"}},{key:"lion-action",title:"Импульс к действию с Львом",category:"Мотивация",description:"Мягкий толчок к делу, которое давно откладываешь",status:"СКОРО",kind:"purpose",active:!1},{key:"focus",title:"Фокус",category:"Концентрация",description:"Освободи мысли и верни внимание к одному важному делу",status:"СКОРО",kind:"focus",active:!1}];return e.jsxs("section",{className:"mx-layered-catalog__section mx-layered-catalog__rail-section","aria-label":"Новое и рекомендованное",children:[e.jsx("div",{className:"mx-layered-catalog__rail-label",children:"Новое и рекомендованное"}),e.jsx("div",{className:"mx-layered-catalog__rail","data-accent":"gold",children:i.map(n=>e.jsxs("button",{className:"mx-layered-catalog__rail-card",type:"button",disabled:!n.active,"aria-label":n.active?`Открыть ${n.title}`:`${n.title}, скоро`,onClick:r(()=>n.active&&a(n.practice),"onClick"),children:[e.jsx("span",{className:"mx-layered-catalog__avatar","aria-hidden":"true",children:e.jsx(Le,{kind:n.kind,highlighted:n.active})}),e.jsx("span",{className:"mx-layered-catalog__rail-badge",children:n.status}),e.jsx("span",{className:"mx-layered-catalog__rail-category",children:n.category}),e.jsx("strong",{children:n.title}),e.jsx("small",{children:n.description})]},n.key))})]})}r(ot,"PracticeRail");function dt({themes:s,onOpen:a}){const[t,i]=o.useState(0),n=o.useRef(null),l=s[0],c=(l==null?void 0:l.questions)||[];function d(){const x=n.current;if(!x||!x.clientWidth)return;const h=[...x.querySelectorAll(".mx-layered-catalog__theme")],u=x.scrollLeft+x.clientWidth/2,p=h.reduce((v,y,C)=>{const A=Math.abs(y.offsetLeft+y.offsetWidth/2-u),b=Math.abs(h[v].offsetLeft+h[v].offsetWidth/2-u);return A<b?C:v},0);i(p)}if(r(d,"handleScroll"),!l||c.length===0)return e.jsxs("section",{className:"mx-layered-catalog__section","aria-labelledby":"theme-title",children:[e.jsx("div",{className:"mx-layered-catalog__section-head",children:e.jsxs("div",{children:[e.jsx("span",{children:"Тема недели:"}),e.jsx("h3",{id:"theme-title",children:"Пока нет вопросов"})]})}),e.jsx("p",{className:"mx-layered-catalog__empty-copy",children:"Вопросы появятся, когда backend вернёт опубликованную тему для этого пользователя."})]});const m={...c[t],themeId:l.id};return e.jsxs("section",{className:"mx-layered-catalog__section mx-layered-catalog__theme-section","aria-labelledby":"theme-title",children:[e.jsx("div",{className:"mx-layered-catalog__section-head",children:e.jsxs("div",{children:[e.jsx("span",{children:"Тема недели:"}),e.jsx("h3",{id:"theme-title",children:"Один вопрос."})]})}),e.jsx("div",{className:"mx-layered-catalog__theme-track",ref:n,onScroll:d,children:c.map((x,h)=>e.jsx("button",{className:"mx-layered-catalog__theme",type:"button","aria-label":`Вопрос ${h+1}: ${x.question}`,tabIndex:-1,children:e.jsxs("span",{className:"mx-layered-catalog__theme-copy",children:[e.jsx("span",{className:"mx-layered-catalog__theme-number",children:h+1}),e.jsx("strong",{className:"mx-layered-catalog__theme-question",children:x.question}),e.jsx("span",{className:"mx-layered-catalog__theme-subtitle",children:x.explanation})]})},x.id))}),e.jsx("span",{className:"mx-layered-catalog__dots","aria-label":`Вопрос ${t+1} из ${c.length}`,children:c.map((x,h)=>e.jsx("i",{"data-active":h===t?"true":void 0},x.id))}),e.jsx("div",{className:"mx-layered-catalog__theme-actions",children:e.jsxs("button",{type:"button",className:"mx-layered-catalog__pill",onClick:r(()=>a(m),"onClick"),children:["Начать запись ",e.jsx(E,{size:15})]})})]})}r(dt,"ThemeCarousel");function mt({collection:s,onOpen:a}){return e.jsxs("button",{className:"mx-layered-catalog__collection",type:"button",onClick:r(()=>a(s),"onClick"),children:[e.jsx("span",{className:"mx-layered-catalog__collection-art","aria-hidden":"true",children:e.jsx(Le,{kind:s.kind})}),e.jsx("strong",{children:s.title}),e.jsx("small",{children:s.description}),e.jsx(ds,{className:"mx-layered-catalog__collection-chevron",size:17,"aria-hidden":"true"})]})}r(mt,"CollectionTile");function xt({onOpen:s}){return e.jsxs("section",{className:"mx-layered-catalog__section","aria-labelledby":"collections-title",children:[e.jsxs("div",{className:"mx-layered-catalog__section-head",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Собрано для тебя"}),e.jsx("h3",{id:"collections-title",children:"Коллекции"})]}),e.jsx("small",{children:"4"})]}),e.jsx("div",{className:"mx-layered-catalog__collections",children:$s.filter(a=>a.key!=="lila").map(a=>e.jsx(mt,{collection:a,onOpen:s},a.key))})]})}r(xt,"Collections");function Fe(s){return(s==null?void 0:s.name)||(s==null?void 0:s.title)||(s==null?void 0:s.text)||"Без названия"}r(Fe,"itemLabel");function ht({collection:s,practices:a,rituals:t,ascezas:i,onBack:n,onOpenPractice:l}){const c=(s.practiceKeys||[]).map(x=>os(a,x)).filter(Boolean),d=s.source==="rituals"?t:s.source==="ascezas"?i:[],m=d.length>0?d:c;return e.jsxs("section",{className:"mx-layered-category","aria-labelledby":"layered-category-title",children:[e.jsxs("header",{className:"mx-layered-category__header",children:[e.jsx("button",{type:"button","aria-label":"Назад к коллекциям",onClick:n,children:e.jsx(R,{size:19})}),e.jsxs("div",{className:"mx-layered-category__heading",children:[e.jsxs("h3",{id:"layered-category-title",children:[s.title,"."]}),e.jsx("p",{children:s.description})]}),e.jsx("span",{"aria-hidden":"true"})]}),e.jsx("div",{className:"mx-layered-category__body",children:e.jsxs("section",{className:"mx-layered-category__section",children:[e.jsx("span",{className:"mx-layered-category__label",children:s.source?"Твои данные":"Практики"}),e.jsx("div",{className:"mx-layered-category__grid",children:m.map(x=>{const h=x.key?x:null,u=(h==null?void 0:h.key)||`${s.key}-${x.id||Fe(x)}`;return e.jsxs("button",{className:"mx-layered-category__card",type:"button",onClick:r(()=>h&&l(h),"onClick"),disabled:!h,children:[e.jsxs("span",{className:"mx-layered-category__art","aria-hidden":"true",children:[e.jsx("span",{className:"mx-layered-category__art-glyph",children:e.jsx(Le,{kind:(h==null?void 0:h.kind)||s.kind})}),e.jsx("span",{className:"mx-layered-category__art-base"})]}),e.jsx("strong",{children:(h==null?void 0:h.title)||Fe(x)}),e.jsx("small",{children:(h==null?void 0:h.subtitle)||(s.source==="rituals"?x.today_level?"сегодня выполнено":"открыть ритуалы":x.today_status==="held"?"сегодня удержано":"открыть аскезы")}),(h==null?void 0:h.completedToday)&&e.jsx("span",{className:"mx-layered-category__completion",children:"сегодня"})]},u)})})]})})]})}r(ht,"CollectionScreen");function pt({onBack:s}){const[a,t]=o.useState("");return e.jsxs("section",{className:"mx-layered-journal-demo","aria-labelledby":"journal-demo-title",children:[e.jsxs("button",{type:"button",className:"mx-layered-journal-demo__back",onClick:s,children:[e.jsx(R,{size:18})," Назад в каталог"]}),e.jsx("span",{className:"mx-layered-journal-demo__eyebrow",children:"Preview-only · без сохранения"}),e.jsx("h3",{id:"journal-demo-title",children:"Собери день в четыре шага"}),e.jsx("p",{children:"В Telegram-сессии эта кнопка откроет настоящий JournalFlow. Здесь можно посмотреть только форму и ритм записи."}),e.jsx("textarea",{value:a,onChange:r(i=>t(i.target.value),"onChange"),placeholder:"Начни писать…","aria-label":"Демонстрационная запись журнала"}),e.jsx("button",{type:"button",className:"mx-layered-catalog__pill",onClick:s,children:"Закрыть preview"})]})}r(pt,"JournalDemoScreen");function ut({onOpen:s}){return e.jsxs("article",{className:"mx-layered-catalog__journal-hero",children:[e.jsx("div",{className:"mx-layered-catalog__journal-hero-art","aria-hidden":"true",children:e.jsx(Se,{})}),e.jsxs("div",{className:"mx-layered-catalog__journal-hero-copy",children:[e.jsx("span",{children:"Журнал"}),e.jsx("h3",{children:"Собери день в четыре шага"}),e.jsx("p",{children:"Идея, действие, анализ и новый шаг — спокойно, в своём темпе."}),e.jsxs("button",{type:"button",className:"mx-layered-catalog__pill",onClick:s,children:["Открыть журнал ",e.jsx(E,{size:15})]})]})]})}r(ut,"JournalBanner");function bt({theme:s,onBack:a}){return e.jsxs("section",{className:"mx-layered-theme-demo","aria-labelledby":"theme-demo-title",children:[e.jsxs("button",{type:"button",className:"mx-layered-journal-demo__back",onClick:a,children:[e.jsx(R,{size:18})," Назад в каталог"]}),e.jsx("span",{className:"mx-layered-journal-demo__eyebrow",children:"Демонстрационные данные · без сохранения"}),e.jsx("h3",{id:"theme-demo-title",children:s.question}),e.jsx("p",{children:s.explanation}),e.jsxs("div",{className:"mx-layered-theme-demo__progress",children:[e.jsxs("strong",{children:["Вопрос ",s.number||""]}),e.jsx("span",{children:"Демонстрационный вопрос UI Lab; запись не сохраняется."})]}),e.jsx("button",{type:"button",className:"mx-layered-catalog__pill",onClick:a,children:"Вернуться к каталогу"})]})}r(bt,"ThemeDemoScreen");function jt({status:s,error:a,onReload:t}){return s==="ready"?null:s==="demo"?e.jsxs("div",{className:"mx-layered-catalog__data-note mx-layered-catalog__data-note--demo",role:"status",children:[e.jsx("strong",{children:"Демонстрационные данные · без сохранения"}),e.jsx("span",{children:"Каталог показывает реальные структуры API и flow-связи. Введённый текст и действия не записываются в аккаунт."})]}):s==="loading"?e.jsx("div",{className:"mx-layered-catalog__data-note",children:"Загружаю реальные практики и темы…"}):e.jsxs("div",{className:"mx-layered-catalog__data-note",role:"alert",children:[e.jsx("strong",{children:"Не удалось загрузить live-данные"}),e.jsx("span",{children:(a==null?void 0:a.message)||"Проверь API-сессию и повтори загрузку."}),e.jsxs("button",{type:"button",className:"mx-layered-catalog__pill",onClick:t,children:[e.jsx(Zs,{size:14})," Повторить"]})]})}r(jt,"PreviewStatus");function Ge({mode:s="after"}){const a=o.useMemo(()=>{var _,g;return((g=(_=T).getUser)==null?void 0:g.call(_))||null},[]),{rituals:t,ascezas:i,themes:n,status:l,error:c,reload:d}=ct(a),[m,x]=o.useState(null),[h,u]=o.useState(null),[p,v]=o.useState(!1),[y,C]=o.useState(null),A=o.useMemo(()=>a?new Set:new Set(lt),[a]),b=o.useMemo(()=>zs({rituals:t,ascezas:i,completedToday:A}),[t,i,A]);return p&&a?e.jsx(f,{number:"26",eyebrow:"UI-EXP-003 · live journal preview",title:"Журнал",purpose:"Реальный JournalFlow открывается из крупного journal-banner.",mode:s,children:e.jsx(nt,{userId:a.id,onClose:r(()=>v(!1),"onClose"),onOpenGuided:r(()=>v(!1),"onOpenGuided")})}):p?e.jsx(f,{number:"26",eyebrow:"UI-EXP-003 · anonymous journal preview",title:"Журнал",purpose:"Демонстрация крупного journal-banner без пользователя; запись не сохраняется.",mode:s,children:e.jsx(pt,{onBack:r(()=>v(!1),"onBack")})}):h&&!a?e.jsx(f,{number:"26",eyebrow:"UI-EXP-003 · demo theme preview",title:"Тема недели",purpose:"Демонстрационная тема в форме реального API-объекта; сохранения нет.",mode:s,children:e.jsx(bt,{theme:h,onBack:r(()=>u(null),"onBack")})}):h&&a?e.jsx(f,{number:"26",eyebrow:"UI-EXP-003 · live theme preview",title:"Тема недели",purpose:"Реальный ThemeScreen с backend themeId; UI Lab не подменяет тематический flow мокапом.",mode:s,children:e.jsx(Ys,{user:a,themeId:h.themeId,onBack:r(()=>u(null),"onBack")})}):e.jsx(f,{number:"26",eyebrow:"UI-EXP-003 · live catalog preview",title:"практики.",purpose:"Preview-only композиция из реальных practice keys, live themes и пяти production-коллекций.",mode:s,children:e.jsxs("div",{className:"mx-layered-catalog mx-layered-catalog--mxl-547-preview","data-accent":"gold",children:[e.jsx(ut,{onOpen:r(()=>v(!0),"onOpen")}),e.jsx(jt,{status:l,error:c,onReload:d}),e.jsx(ot,{practices:b,onOpen:r(_=>C(_),"onOpen")}),e.jsx(dt,{themes:n,onOpen:r(_=>u(_),"onOpen")}),e.jsx(xt,{onOpen:r(_=>x(_),"onOpen")}),m&&e.jsx(ht,{collection:m,practices:b,rituals:t,ascezas:i,onBack:r(()=>x(null),"onBack"),onOpenPractice:r(_=>C(_),"onOpenPractice")}),y&&e.jsxs("div",{className:"mx-layered-catalog__mapping-note",role:"status",children:[e.jsx("strong",{children:y.title}),e.jsxs("span",{children:["Реальный mapping: ",e.jsxs("code",{children:["practiceKey=",y.key]})," →"," ",e.jsxs("code",{children:["setSub('",y.sub,"')"]})]}),e.jsx("button",{type:"button",className:"mx-layered-catalog__pill",onClick:r(()=>C(null),"onClick"),children:"Закрыть"})]})]})})}r(Ge,"LayeredPracticeCatalogExperiment");const B=[{key:"result",eyebrow:"Фактический результат",title:"Что получилось сегодня?",options:["Сделал главное","Сделал часть","День пошёл иначе"]},{key:"reflection",eyebrow:"Короткая рефлексия",title:"Что забираешь с собой?",options:["Ясность","Опыт","Нужно отпустить"]},{key:"pattern",eyebrow:"Закономерность",title:"Что повторяется?",options:["Маленький шаг помогает","Тороплюсь — теряю фокус","Сегодня не вижу связи"]},{key:"next",eyebrow:"Завтра · один шаг",title:"Что будет достаточно сделать?",options:["Начать с пяти минут","Оставить место для паузы","Вернуться к главному"]}];function _t({onStart:s}){return e.jsxs("section",{className:"mx-evening-review__entry","aria-labelledby":"evening-review-title",children:[e.jsx("span",{className:"mx-evening-review__eyebrow",children:"Today · reviewPending"}),e.jsx("h2",{id:"evening-review-title",children:"Разобрать день"}),e.jsx("p",{children:"Посмотреть на факты, заметить главное и оставить завтрашнему дню один шаг."}),e.jsx("div",{className:"mx-evening-review__entry-art","aria-hidden":"true",children:e.jsx(w,{kind:"release",animated:!1,highlighted:!1})}),e.jsx("span",{className:"mx-evening-review__duration",children:"около 1 минуты"}),e.jsxs("button",{type:"button",className:"mx-evening-review__primary",onClick:s,children:["Разобрать день",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(_t,"ReviewEntry");function gt({step:s,index:a,answer:t,onAnswer:i,onBack:n,onExit:l}){const c=!!t;return e.jsxs("section",{className:"mx-evening-review__step","aria-labelledby":"evening-review-step-title",children:[e.jsxs("div",{className:"mx-evening-review__topline",children:[e.jsx("button",{type:"button",onClick:n,"aria-label":"Назад",children:"← Назад"}),e.jsxs("span",{children:[a+1," / ",B.length]}),e.jsx("button",{type:"button",onClick:l,"aria-label":"Выйти из разбора",children:"Выйти"})]}),e.jsx("div",{className:"mx-evening-review__step-progress","aria-hidden":"true",children:e.jsx("span",{style:{width:`${(a+1)/B.length*100}%`}})}),e.jsxs("div",{className:"mx-evening-review__step-center",children:[e.jsx("span",{className:"mx-evening-review__eyebrow",children:s.eyebrow}),e.jsx("h2",{id:"evening-review-step-title",children:s.title}),e.jsx("div",{className:"mx-evening-review__choices",role:"radiogroup","aria-label":s.title,children:s.options.map(d=>e.jsx("button",{type:"button",role:"radio","aria-checked":t===d,"data-selected":t===d,onClick:r(()=>i(d),"onClick"),children:d},d))})]}),e.jsxs("button",{type:"button",className:"mx-evening-review__primary",disabled:!c,onClick:r(()=>i("__next__"),"onClick"),children:[a===B.length-1?"Закрыть день":"Дальше",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(gt,"ReviewStep");function yt({onContinue:s}){return e.jsxs("section",{className:"mx-evening-review__closed","aria-labelledby":"evening-review-closed-title",children:[e.jsx("div",{className:"mx-evening-review__closed-art","aria-hidden":"true",children:e.jsx(w,{kind:"finish",animated:!1,highlighted:!1})}),e.jsx("span",{className:"mx-evening-review__eyebrow",children:"День закрыт"}),e.jsx("h2",{id:"evening-review-closed-title",children:"Главное осталось с тобой"}),e.jsx("p",{children:"Завтра достаточно вернуться к одному выбранному шагу."}),e.jsxs("button",{type:"button",className:"mx-evening-review__primary",onClick:s,children:["Продолжить",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(yt,"ReviewClosed");function vs({onDayClosed:s}={}){const[a,t]=o.useState("entry"),[i,n]=o.useState(0),[l,c]=o.useState({});function d(){t("entry"),n(0),c({})}r(d,"reset");function m(u){if(u==="__next__"){i===B.length-1?t("closed"):n(p=>p+1);return}c(p=>({...p,[B[i].key]:u}))}if(r(m,"choose"),a==="entry")return e.jsxs("section",{className:"mx-evening-review","aria-labelledby":"evening-review-experiment-title",children:[e.jsxs("div",{className:"mx-evening-review__experiment-head",children:[e.jsx("span",{children:"Вечерний разбор · Preview-only"}),e.jsx("h2",{id:"evening-review-experiment-title",children:"Закрыть день без отчёта"}),e.jsx("p",{children:"Один короткий маршрут: факт, вывод, закономерность и следующий шаг."})]}),e.jsx("div",{className:"mx-evening-review__surface",children:e.jsx(_t,{onStart:r(()=>t("step"),"onStart")})})]});if(a==="closed")return e.jsx("div",{className:"mx-evening-review__overlay",children:e.jsx(yt,{onContinue:s||d})});const x=B[i],h=l[x.key];return e.jsx("div",{className:"mx-evening-review__overlay",children:e.jsx(gt,{step:x,index:i,answer:h,onAnswer:m,onBack:r(()=>i===0?t("entry"):n(u=>u-1),"onBack"),onExit:d})})}r(vs,"EveningReviewExperiment");const Ve=[{key:"mood",label:"Настроение"},{key:"energy",label:"Энергия"},{key:"noise",label:"Шум в голове"},{key:"focus",label:"Фокус / собранность"}],vt=["Сделать главное","Разобраться с важным","Позаботиться о себе"];function J({children:s,onBack:a,onExit:t,progress:i,label:n}){const l=ns();return bs.createPortal(e.jsx("div",{className:"mx-morning__overlay",style:l.style,children:e.jsxs("div",{className:"mx-morning__shell",children:[e.jsxs("div",{className:"mx-morning__topline",children:[e.jsx("button",{type:"button",onClick:a,"aria-label":"Назад",children:"← Назад"}),e.jsx("span",{children:n}),e.jsx("button",{type:"button",onClick:t,"aria-label":"Выйти из чек-ина",children:"Выйти"})]}),e.jsx("div",{className:"mx-morning__progress","aria-hidden":"true",children:e.jsx("span",{style:{width:`${i}%`}})}),s]})}),ls())}r(J,"Shell");function Y({children:s,disabled:a,onClick:t}){return e.jsxs("button",{type:"button",className:"mx-morning__primary",disabled:a,onClick:t,children:[s,e.jsx("span",{"aria-hidden":"true",children:"→"})]})}r(Y,"PrimaryButton");function ft({metric:s,value:a,onChange:t}){return e.jsxs("div",{className:"mx-morning__metric",children:[e.jsxs("div",{className:"mx-morning__metric-head",children:[e.jsx("span",{children:s.label}),e.jsxs("strong",{children:[a||"—"," / 5"]})]}),e.jsx("div",{className:"mx-morning__metric-buttons",role:"radiogroup","aria-label":s.label,children:[1,2,3,4,5].map(i=>e.jsx("button",{type:"button",role:"radio","aria-label":`${s.label}: ${i} из 5`,"aria-checked":a===i,"data-selected":a===i,onClick:r(()=>t(i),"onClick"),children:i},i))})]})}r(ft,"MetricControl");function Nt({values:s,onChange:a,onNext:t,onBack:i,onExit:n}){const l=Ve.every(c=>s[c.key]);return e.jsxs(J,{onBack:i,onExit:n,progress:25,label:"Состояние · 1 / 3",children:[e.jsxs("section",{className:"mx-morning__screen","aria-labelledby":"morning-state-title",children:[e.jsx("span",{className:"mx-morning__eyebrow",children:"Сначала — заметить себя"}),e.jsx("h2",{id:"morning-state-title",children:"Как ты сегодня?"}),e.jsx("p",{className:"mx-morning__lead",children:"Четыре короткие шкалы без правильного ответа."}),e.jsx("div",{className:"mx-morning__metrics",children:Ve.map(c=>e.jsx(ft,{metric:c,value:s[c.key],onChange:r(d=>a(c.key,d),"onChange")},c.key))})]}),e.jsx(Y,{disabled:!l,onClick:t,children:"Дальше"})]})}r(Nt,"StateScreen");function wt({value:s,custom:a,onValue:t,onCustom:i,onNext:n,onBack:l,onExit:c}){const d=a.trim()||s;return e.jsxs(J,{onBack:l,onExit:c,progress:50,label:"Главное · 2 / 3",children:[e.jsxs("section",{className:"mx-morning__screen","aria-labelledby":"morning-main-title",children:[e.jsx("span",{className:"mx-morning__eyebrow",children:"Один смысловой центр"}),e.jsx("h2",{id:"morning-main-title",children:"Что сегодня действительно важно?"}),e.jsx("div",{className:"mx-morning__choices",role:"radiogroup","aria-label":"Главное на сегодня",children:vt.map(m=>e.jsx("button",{type:"button",role:"radio","aria-checked":s===m&&!a,"data-selected":s===m&&!a,onClick:r(()=>{t(m),i("")},"onClick"),children:m},m))}),e.jsxs("label",{className:"mx-morning__input-label",children:[e.jsx("span",{children:"Своё"}),e.jsx("input",{type:"text",value:a,maxLength:140,placeholder:"Напиши коротко",onChange:r(m=>{i(m.target.value),t("")},"onChange")})]})]}),e.jsx(Y,{disabled:!d,onClick:n,children:"Выбрать шаг"})]})}r(wt,"MainScreen");function Ct({value:s,onChange:a,onNext:t,onBack:i,onExit:n}){return e.jsxs(J,{onBack:i,onExit:n,progress:75,label:"Первый шаг · 3 / 3",children:[e.jsxs("section",{className:"mx-morning__screen","aria-labelledby":"morning-step-title",children:[e.jsx("span",{className:"mx-morning__eyebrow",children:"Сделать маленьким"}),e.jsx("h2",{id:"morning-step-title",children:"Что ты можешь начать за 5–10 минут?"}),e.jsxs("label",{className:"mx-morning__input-label mx-morning__input-label--large",children:[e.jsx("span",{children:"Первый шаг"}),e.jsx("textarea",{value:s,rows:4,maxLength:240,placeholder:"Например: открыть документ и написать первый абзац",onChange:r(l=>a(l.target.value),"onChange")})]}),e.jsx("p",{className:"mx-morning__hint",children:"Это не весь план. Только действие, с которого можно начать."})]}),e.jsx(Y,{disabled:!s.trim(),onClick:t,children:"Начать день"})]})}r(Ct,"StepScreen");function kt({main:s,firstStep:a,onConfirm:t,onBack:i,onExit:n}){return e.jsxs(J,{onBack:i,onExit:n,progress:92,label:"Готово",children:[e.jsxs("section",{className:"mx-morning__result","aria-labelledby":"morning-result-title",children:[e.jsx("div",{className:"mx-morning__result-art","aria-hidden":"true",children:e.jsx(w,{kind:"next-step",animated:!1,highlighted:!1})}),e.jsx("span",{className:"mx-morning__eyebrow",children:"На сегодня достаточно"}),e.jsx("h2",{id:"morning-result-title",children:"Главное собрано"}),e.jsxs("dl",{children:[e.jsxs("div",{children:[e.jsx("dt",{children:"Главное"}),e.jsx("dd",{children:s})]}),e.jsxs("div",{children:[e.jsx("dt",{children:"Первый шаг"}),e.jsx("dd",{children:a})]})]})]}),e.jsx(Y,{onClick:t,children:"Подтвердить"})]})}r(kt,"ResultScreen");function St({main:s,firstStep:a,onReset:t}){return e.jsxs("section",{className:"mx-morning__today","aria-labelledby":"morning-today-title",children:[e.jsxs("div",{className:"mx-morning__today-head",children:[e.jsx("span",{className:"mx-morning__eyebrow",children:"Today · dayInProgress · simulated"}),e.jsx("h2",{id:"morning-today-title",children:"День начат"}),e.jsx("p",{children:"Главное осталось рядом. Начни с сохранённого действия."})]}),e.jsxs("div",{className:"mx-morning__action",children:[e.jsx("span",{children:"Главный action · первый шаг"}),e.jsx("strong",{children:a}),e.jsx("small",{children:s})]}),e.jsx("button",{type:"button",className:"mx-morning__secondary",onClick:t,children:"Пройти заново"})]})}r(St,"TodayScreen");function Et({onComplete:s,onExit:a}={}){const[t,i]=o.useState("state"),[n,l]=o.useState({}),[c,d]=o.useState(""),[m,x]=o.useState(""),[h,u]=o.useState("");function p(){i("state"),l({}),d(""),x(""),u("")}r(p,"reset");const v=a||p,y=m.trim()||c;return t==="today"?e.jsx(St,{main:y,firstStep:h,onReset:p}):t==="state"?e.jsxs("section",{className:"mx-morning","aria-labelledby":"morning-experiment-title",children:[e.jsxs("div",{className:"mx-morning__experiment-head",children:[e.jsx("span",{children:"Утренний чек-ин · Preview-only"}),e.jsx("h2",{id:"morning-experiment-title",children:"Собрать день из одного шага"}),e.jsx("p",{children:"Локальная гипотеза для Today/checkinPending. Данные никуда не отправляются."})]}),e.jsx(Nt,{values:n,onChange:r((C,A)=>l(b=>({...b,[C]:A})),"onChange"),onNext:r(()=>i("main"),"onNext"),onBack:v,onExit:v})]}):t==="main"?e.jsx(wt,{value:c,custom:m,onValue:d,onCustom:x,onNext:r(()=>i("step"),"onNext"),onBack:r(()=>i("state"),"onBack"),onExit:v}):t==="step"?e.jsx(Ct,{value:h,onChange:u,onNext:r(()=>i("result"),"onNext"),onBack:r(()=>i("main"),"onBack"),onExit:v}):e.jsx(kt,{main:y,firstStep:h.trim(),onConfirm:r(()=>{s?s(y,h.trim()):i("today")},"onConfirm"),onBack:r(()=>i("step"),"onBack"),onExit:v})}r(Et,"MorningCheckinExperiment");const Mt=[{key:"welcome",label:"NEW USER"},{key:"checkinPending",label:"CHECKIN PENDING"},{key:"dayInProgress",label:"DAY IN PROGRESS"},{key:"reviewPending",label:"REVIEW PENDING"},{key:"dayClosed",label:"DAY CLOSED"}];function Pt({onStart:s}){return e.jsxs("section",{className:"mx-daily__welcome","aria-labelledby":"daily-welcome-title",children:[e.jsx("span",{className:"mx-daily__wordmark",children:"Mentalix."}),e.jsx("h2",{id:"daily-welcome-title",children:"Понять, что важно. Сделать следующий шаг."}),e.jsx("p",{children:"Один день целиком: чек-ин → первый шаг → разбор вечером."}),e.jsxs("button",{type:"button",className:"mx-daily__primary",onClick:s,children:["Начать",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(Pt,"WelcomeScreen");function Q({state:s,mainRitualName:a}){return e.jsx("div",{className:"mx-daily__surface","data-state":s,children:e.jsx(is,{user:gs,previewFixture:ys(s,{mainRitualName:a}),previewState:s,onOpenPractice:r(()=>{},"onOpenPractice"),onGoMentor:r(()=>{},"onGoMentor"),onFlowChange:r(()=>{},"onFlowChange")},`${s}:${a||""}`)})}r(Q,"TodayBaseline");function At({mainRitualName:s,onStartCheckin:a}){return e.jsxs("div",{className:"mx-daily__phase",children:[e.jsx(Q,{state:"checkinPending",mainRitualName:s}),e.jsxs("button",{type:"button",className:"mx-daily__primary mx-daily__bridge",onClick:a,children:["Начать чек-ин",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(At,"CheckinPendingScreen");function Lt({mainRitualName:s,onComplete:a}){return e.jsxs("div",{className:"mx-daily__phase",children:[e.jsx(Q,{state:"dayInProgress",mainRitualName:s}),e.jsxs("button",{type:"button",className:"mx-daily__primary mx-daily__bridge",onClick:a,children:["Отметить выполненным",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(Lt,"DayInProgressScreen");function Rt({onReview:s}){return e.jsxs("section",{className:"mx-daily__completion","aria-labelledby":"daily-completion-title",children:[e.jsx("div",{className:"mx-daily__completion-art","aria-hidden":"true",children:e.jsx(w,{kind:"finish",animated:!1,highlighted:!1})}),e.jsx("span",{className:"mx-daily__eyebrow",children:"Шаг сделан"}),e.jsx("h2",{id:"daily-completion-title",children:"Хорошо. На сегодня достаточно."}),e.jsx("p",{children:"Вечером можно спокойно вернуться и разобрать день."}),e.jsxs("button",{type:"button",className:"mx-daily__primary",onClick:s,children:["К вечернему разбору",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(Rt,"CompletionScreen");function It({mainRitualName:s,onStartReview:a}){return e.jsxs("div",{className:"mx-daily__phase",children:[e.jsx(Q,{state:"reviewPending",mainRitualName:s}),e.jsxs("button",{type:"button",className:"mx-daily__primary mx-daily__bridge",onClick:a,children:["Разобрать день",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(It,"ReviewPendingScreen");function Tt({mainRitualName:s,onNextDay:a}){return e.jsxs("div",{className:"mx-daily__phase",children:[e.jsx(Q,{state:"dayClosed",mainRitualName:s}),e.jsxs("button",{type:"button",className:"mx-daily__primary mx-daily__bridge",onClick:a,children:["Следующий день",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})}r(Tt,"DayClosedScreen");function Dt(){const[s,a]=o.useState("welcome"),[t,i]=o.useState(""),l={paddingTop:o.useSyncExternalStore(Os,Bs)?`calc(var(--app-safe-top) + ${Hs}px)`:"var(--app-safe-top)"};function c(){a("welcome"),i("")}return r(c,"resetAll"),e.jsxs("section",{className:"mx-daily","data-phase":s,"aria-labelledby":"daily-canonical-title",children:[e.jsxs("div",{className:"mx-daily__head",style:l,children:[e.jsx("span",{children:"MXL-DAILY-CANONICAL-UI-LAB-001 · Preview-only"}),e.jsx("h2",{id:"daily-canonical-title",children:"Дневной цикл целиком"}),e.jsx("p",{children:"Welcome → Чек-ин → первый шаг → день → разбор → закрытие дня. Собрано из существующих UI Lab прототипов, API не подключён."})]}),e.jsxs("div",{className:"mx-daily__debug",role:"group","aria-label":"Быстрый переход между состояниями",children:[Mt.map(d=>e.jsx("button",{type:"button","data-active":s===d.key,onClick:r(()=>a(d.key),"onClick"),children:d.label},d.key)),e.jsx("button",{type:"button",className:"mx-daily__debug-reset",onClick:c,children:"RESET"})]}),e.jsxs("div",{className:"mx-daily__stage",children:[s==="welcome"&&e.jsx(Pt,{onStart:r(()=>a("checkinPending"),"onStart")}),s==="checkinPending"&&e.jsx(At,{mainRitualName:t,onStartCheckin:r(()=>a("morningCheckin"),"onStartCheckin")}),s==="morningCheckin"&&e.jsx(Et,{onComplete:r((d,m)=>{i(m),a("dayInProgress")},"onComplete"),onExit:r(()=>a("checkinPending"),"onExit")}),s==="dayInProgress"&&e.jsx(Lt,{mainRitualName:t,onComplete:r(()=>a("completion"),"onComplete")}),s==="completion"&&e.jsx(Rt,{onReview:r(()=>a("reviewPending"),"onReview")}),s==="reviewPending"&&e.jsx(It,{mainRitualName:t,onStartReview:r(()=>a("eveningReview"),"onStartReview")}),s==="eveningReview"&&e.jsx(vs,{onDayClosed:r(()=>a("dayClosed"),"onDayClosed")}),s==="dayClosed"&&e.jsx(Tt,{mainRitualName:t,onNextDay:c})]}),e.jsx("footer",{className:"mx-daily__footer",children:"Preview-only · главное свойство теста непрерывности: First Step дословно доходит от Morning Чек-ин до Today/dayInProgress."})]})}r(Dt,"DailyCanonicalExperiment");const fs={1:["подавлен","вымотан","тревожно","злюсь","пусто","одиноко","обидно","страшно"],2:["устал","раздражён","рассеян","вяло","скучно","неспокойно","недоволен","растерян"],3:["ровно","спокойно","задумчиво","нейтрально","собранно","терпимо","буднично"],4:["бодро","доволен","тепло","включён","благодарен","уверенно","легко","спокойная сила"],5:["воодушевлён","счастлив","свободен","горжусь","вдохновлён","силён","радостно","ясно"]},zt=ea[0].labels,$t=Object.entries(fs).reduce((s,[a,t])=>(t.forEach(i=>{s[i]=Number(a)}),s),{});function Ze(s){return s.map((a,t)=>{const i=t+1;if(!a)return{day:i,level:null,emotion:null};const n=fs[a];return{day:i,level:a,emotion:n[i%n.length]}})}r(Ze,"buildMonthFixture");const Ot=[4,4,3,4,5,4,3,0,2,3,2,2,1,2,3,2,0,4,3,4,4,5,4,4,5,4,5,4,5,4],Bt=[3,4,3,3,4,3,4,3,3,4,3,3,4,4,3,4,3,4,3,4,4,3,4,3,4,4,3,4,4,0],Ne={current:{label:"Этот месяц",days:Ze(Ot)},previous:{label:"Предыдущий месяц",days:Ze(Bt)}};function he(s){return s.length?s.reduce((a,t)=>a+t,0)/s.length:null}r(he,"average");function Ht(s){const a=s.filter(c=>c.level!=null),t=he(a.map(c=>c.level));if(t==null||a.length<3)return{avg:t,count:a.length,trend:null};const i=Math.floor(a.length/2),n=he(a.slice(i).map(c=>c.level))-he(a.slice(0,i).map(c=>c.level)),l=n>.3?"up":n<-.3?"down":"flat";return{avg:t,count:a.length,trend:l}}r(Ht,"computeMoodSummary");function Ut(s){const a=[0,0,0,0,0];return s.forEach(t=>{t.level&&(a[t.level-1]+=1)}),a}r(Ut,"moodLevelBreakdown");function Ft(s,a=5){const t=new Map;s.forEach(n=>{n.emotion&&t.set(n.emotion,(t.get(n.emotion)||0)+1)});const i=[...t.values()].reduce((n,l)=>n+l,0);return[...t.entries()].sort((n,l)=>l[1]-n[1]).slice(0,a).map(([n,l])=>({emotion:n,count:l,percent:i?Math.round(l/i*100):0,level:$t[n]}))}r(Ft,"topEmotions");function Xe(s,a,t,i=3){const n=new Map;return s.forEach(l=>{!l.emotion||!l.level||l.level<a||l.level>t||n.set(l.emotion,(n.get(l.emotion)||0)+1)}),[...n.entries()].sort((l,c)=>c[1]-l[1]).slice(0,i).map(([l])=>l)}r(Xe,"emotionsByLevelRange");function Gt(s){return s.trend==="up"?"К концу месяца настроение заметно выросло.":s.trend==="down"?"К концу месяца настроение немного просело — стоит присмотреться, что изменилось.":"Настроение держится ровно весь месяц."}r(Gt,"heroInsightText");const Vt=[{date:"Сегодня",type:"Вечерний разбор",time:"21:36",preview:"Что сегодня действительно требовало внимания?",answer:"Я сделал один следующий шаг, вместо того чтобы ждать ясности.",tag:"рефлексия"},{date:"Сегодня",type:"Дыхание",time:"18:12",preview:"5 минут · завершено",answer:"Вернулся к спокойному ритму и продолжил работу.",tag:"восстановление"},{date:"Вчера",type:"Утренний чек-ин",time:"09:04",preview:"Состояние: рассеянность · фокус: один шаг",answer:"Сначала записать мысль, потом открыть задачу.",tag:"один шаг"}];function Zt(s){const a=s%10,t=s%100;return a===1&&t!==11?`${s} событие`:[2,3,4].includes(a)&&![12,13,14].includes(t)?`${s} события`:`${s} событий`}r(Zt,"pluralizeEvents");function Xt(s){return s.reduce((a,t)=>{const i=a.find(n=>n.date===t.date);return i?i.entries.push(t):a.push({date:t.date,entries:[t]}),a},[])}r(Xt,"groupHistoryByDate");const We=[{title:"Разбивка по настроению",note:"За этот месяц",kind:"mood-bars"},{title:"Календарь состояния",note:"Одна точка — один день",kind:"heatmap"},{title:"Практики, которые поддерживают",note:"На основе отмеченных дней",kind:"ring"}],Wt=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];function Re({eyebrow:s,title:a,copy:t}){return e.jsxs("div",{className:"mx-history-trends__heading",children:[e.jsx("span",{children:s}),e.jsx("h2",{children:a}),e.jsx("p",{children:t})]})}r(Re,"SectionHeading");function qt({kind:s,breakdown:a}){if(s==="heatmap")return e.jsxs("div",{className:"mx-history-trends__calendar",children:[e.jsx("div",{className:"mx-history-trends__chart mx-history-trends__chart--heatmap","aria-label":"Календарь состояния",children:Array.from({length:35},(t,i)=>e.jsx("i",{"data-filled":i===17,"data-tone":i%2},i))}),e.jsx("div",{className:"mx-history-trends__weekdays","aria-hidden":"true",children:Wt.map(t=>e.jsx("span",{children:t},t))})]});if(s==="ring")return e.jsxs("div",{className:"mx-history-trends__chart mx-history-trends__chart--ring",children:[e.jsx("div",{className:"mx-history-trends__ring","aria-hidden":"true"}),e.jsxs("div",{className:"mx-history-trends__ring-copy",children:[e.jsx("strong",{children:"12"}),e.jsx("span",{children:"сессий"})]})]});if(s==="mood-bars"){const t=Math.max(1,...a);return e.jsx("div",{className:"mx-history-trends__chart mx-history-trends__chart--mood",children:a.map((i,n)=>{const l=n+1,c=i>0&&i===t;return e.jsxs("div",{className:"mx-history-trends__mood-col",children:[e.jsx("div",{className:"mx-history-trends__mood-stick-track",children:e.jsx("i",{"data-active":c,style:{height:`${Math.max(i/t*100,6)}%`}})}),e.jsx(js,{level:l,active:c,size:18}),e.jsx("span",{children:i})]},l)})})}return null}r(qt,"Chart");function Kt(){const[s,a]=o.useState(null),t=o.useMemo(()=>Xt(Vt),[]);return e.jsxs("section",{className:"mx-history-trends__section","aria-labelledby":"history-preview-title",children:[e.jsx(Re,{eyebrow:"Новый паттерн · хронологическая лента",title:"История",copy:"События собраны по датам. Системные вехи живут в той же ленте, а деталь открывается отдельным экраном."}),e.jsxs("div",{className:"mx-history-trends__toolbar",children:[e.jsxs("button",{type:"button",children:["Месяц ",e.jsx(_e,{size:14})]}),e.jsxs("button",{type:"button",children:[e.jsx(Xs,{size:14})," Фильтры"]}),e.jsx("button",{type:"button","aria-label":"Поиск",children:e.jsx(ke,{size:15})})]}),e.jsx("div",{className:"mx-history-trends__history",id:"history-preview-title",children:t.map(i=>e.jsxs("div",{className:"mx-history-trends__day",children:[e.jsxs("div",{className:"mx-history-trends__date",children:[e.jsx("strong",{children:i.date}),e.jsx("span",{children:Zt(i.entries.length)}),e.jsx(_e,{size:14})]}),i.entries.map(n=>e.jsxs(o.Fragment,{children:[e.jsxs("button",{type:"button",className:"mx-history-trends__entry",onClick:r(()=>a(n),"onClick"),children:[e.jsxs("span",{children:[e.jsx("strong",{children:n.type}),e.jsx("time",{children:n.time})]}),e.jsx("em",{children:n.preview}),e.jsx("small",{children:n.tag})]}),n.type==="Дыхание"&&e.jsxs("div",{className:"mx-history-trends__milestone",children:[e.jsx(w,{kind:"purpose",animated:!1}),e.jsxs("div",{children:[e.jsx("strong",{children:"Первый следующий шаг"}),e.jsx("span",{children:"Ты возвращаешься к действию уже 7 дней."})]}),e.jsx(K,{size:16})]})]},n.type))]},i.date))}),s&&e.jsxs("div",{className:"mx-history-trends__detail",children:[e.jsxs("button",{type:"button",onClick:r(()=>a(null),"onClick"),children:[e.jsx(R,{size:15})," История"]}),e.jsxs("span",{children:[s.date.toUpperCase()," · ",s.time]}),e.jsx("h3",{children:s.type}),e.jsx("p",{className:"question",children:s.preview}),e.jsx("p",{children:s.answer}),e.jsx("button",{type:"button",onClick:r(()=>a(null),"onClick"),children:"Закрыть"})]})]})}r(Kt,"HistoryPreview");function Jt({state:s,summary:a,monthLabel:t}){return s!=="data"||a.count===0?e.jsxs("div",{className:"mx-history-trends__hero",children:[e.jsx("span",{children:"Среднее за месяц"}),e.jsx("h2",{children:"среднее настроение."}),e.jsx("p",{children:s==="progress"?"Пока рано считать среднее — сделай ещё несколько чек-инов, чтобы картина стала честной.":"Здесь появится честное среднее, как только наберётся пара отметок настроения."})]}):e.jsxs("div",{className:"mx-history-trends__hero",children:[e.jsxs("span",{children:["Среднее за месяц · ",t.toLowerCase()]}),e.jsx("h2",{children:"среднее настроение."}),e.jsxs("div",{className:"mx-history-trends__hero-value",children:[e.jsx("strong",{children:a.avg.toFixed(1)}),e.jsxs("span",{children:["из 5 · ",zt[Math.round(a.avg)-1]]})]}),e.jsx("p",{children:Gt(a)})]})}r(Jt,"MoodHero");function Yt({state:s,days:a,activeMonth:t,onMonthChange:i}){const n=a.filter(p=>p.level!=null),l=a.length,c=300,d=100,m=r(p=>(p-1)/(l-1)*c,"toX"),x=r(p=>d-(p-1)/4*d,"toY"),h=n.map((p,v)=>`${v===0?"M":"L"} ${m(p.day).toFixed(1)} ${x(p.level).toFixed(1)}`).join(" "),u=[1,5,10,15,20,25,l];return e.jsxs("div",{className:"mx-history-trends__month",children:[e.jsxs("div",{className:"mx-history-trends__month-head",children:[e.jsx("strong",{children:"Настроение по дням"}),e.jsx("div",{className:"mx-history-trends__month-toggle",role:"group","aria-label":"Период",children:Object.entries(Ne).map(([p,v])=>e.jsx("button",{type:"button","aria-pressed":t===p,onClick:r(()=>i(p),"onClick"),children:v.label},p))})]}),s==="data"&&n.length>1?e.jsxs(e.Fragment,{children:[e.jsxs("svg",{viewBox:`0 0 ${c} ${d}`,className:"mx-history-trends__month-chart",preserveAspectRatio:"none","aria-hidden":"true",children:[e.jsx("path",{d:h}),n.map(p=>e.jsx("circle",{cx:m(p.day),cy:x(p.level),r:"1.6"},p.day))]}),e.jsx("div",{className:"mx-history-trends__month-axis",children:u.map(p=>e.jsx("span",{style:{left:`${(p-1)/(l-1)*100}%`},children:p},p))})]}):e.jsxs("div",{className:"mx-history-trends__empty",children:[e.jsx("strong",{children:s==="empty"?"Пока нет ни одной отметки":"График соберётся из отметок"}),e.jsx("span",{children:s==="empty"?"Отметь настроение — точки появятся день за днём.":"Ещё несколько чек-инов — и линия станет заметной."})]})]})}r(Yt,"MonthLineChart");function Qt({items:s}){const a=s.reduce((l,c)=>l+c.count,0),t=30,i=2*Math.PI*t,n=s.reduce((l,c,d)=>{const m=l[d-1],x=m?m.start+m.length:0,h=a?c.count/a*i:0;return[...l,{emotion:c.emotion,length:h,start:x}]},[]);return e.jsx("svg",{viewBox:"0 0 76 76",className:"mx-history-trends__donut","aria-hidden":"true",children:e.jsxs("g",{transform:"rotate(-90 38 38)",children:[e.jsx("circle",{cx:"38",cy:"38",r:t,className:"mx-history-trends__donut-track"}),n.map((l,c)=>e.jsx("circle",{cx:"38",cy:"38",r:t,className:"mx-history-trends__donut-segment","data-rank":c,strokeDasharray:`${l.length} ${i-l.length}`,strokeDashoffset:-l.start},l.emotion))]})})}r(Qt,"EmotionDonut");function er({state:s,emotions:a,risers:t,fallers:i}){const n=s==="data"&&a.length>0;return e.jsxs("div",{className:"mx-history-trends__emotions",role:"region","aria-labelledby":"emotions-title",children:[e.jsxs("div",{className:"mx-history-trends__emotions-heading",children:[e.jsx("strong",{id:"emotions-title",children:"Эмоции"}),e.jsx("span",{children:"Те же слова из чек-ина, собранные в частоты за месяц — без эмодзи-рожиц."})]}),n?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"mx-history-trends__emotions-top",children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Топ эмоций месяца"}),e.jsx(Qt,{items:a})]}),e.jsx("ul",{className:"mx-history-trends__emotions-list",children:a.map(l=>e.jsxs("li",{children:[e.jsx(js,{level:l.level,active:!1,size:16}),e.jsx("span",{children:l.emotion}),e.jsxs("em",{children:[l.percent,"%"]})]},l.emotion))})]}),e.jsxs("div",{className:"mx-history-trends__emotions-cards",children:[e.jsxs("article",{children:[e.jsx("strong",{children:"Что поднимает"}),t.length?e.jsx("ul",{children:t.map(l=>e.jsx("li",{children:l},l))}):e.jsx("span",{className:"mx-history-trends__emotions-empty",children:"Пока не набралось данных"})]}),e.jsxs("article",{children:[e.jsx("strong",{children:"Что понижает"}),i.length?e.jsx("ul",{children:i.map(l=>e.jsx("li",{children:l},l))}):e.jsx("span",{className:"mx-history-trends__emotions-empty",children:"Пока не набралось данных"})]})]})]}):e.jsxs("div",{className:"mx-history-trends__empty",children:[e.jsx("strong",{children:s==="empty"?"Пока нет ни одной эмоции":"Эмоции ещё собираются"}),e.jsx("span",{children:s==="empty"?"Выбери слово в чек-ине — здесь появится первая точка.":"Ещё немного отметок — и появится честная картина."})]})]})}r(er,"EmotionsSection");function sr(){const[s,a]=o.useState([]),[t,i]=o.useState("data"),[n,l]=o.useState("current"),c=Ne[n].days,d=o.useMemo(()=>Ht(c),[c]),m=o.useMemo(()=>Ut(c),[c]),x=o.useMemo(()=>Ft(c),[c]),h=o.useMemo(()=>Xe(c,4,5),[c]),u=o.useMemo(()=>Xe(c,1,2),[c]),p=We.filter((y,C)=>!s.includes(C)),v=t==="data"?["Твой месяц становится видимым","Здесь появятся повторяющиеся закономерности."]:t==="empty"?["Добавь первую точку","Отметь настроение прямо здесь, без нового экрана."]:["Ещё немного данных","Отметь состояние ещё в 4 днях, чтобы открыть инсайты."];return e.jsxs("section",{className:"mx-history-trends__section","aria-labelledby":"trends-preview-title",children:[e.jsx(Re,{eyebrow:"Новый паттерн · insight-карточка",title:"Тренды",copy:"Модульный дашборд: каждый блок можно скрыть, а состояние всегда объясняет, что делать дальше."}),e.jsx("div",{className:"mx-history-trends__states",role:"group","aria-label":"Состояние данных",children:[["data","Есть данные"],["empty","Нет данных"],["progress","Нужно ещё 4 дня"]].map(([y,C])=>e.jsx("button",{type:"button","aria-pressed":t===y,onClick:r(()=>i(y),"onClick"),children:C},y))}),e.jsx(Jt,{state:t,summary:d,monthLabel:Ne[n].label}),e.jsx(Yt,{state:t,days:c,activeMonth:n,onMonthChange:l}),e.jsxs("div",{className:"mx-history-trends__activation",children:[e.jsx(w,{kind:"focus",animated:!1}),e.jsxs("div",{children:[e.jsx("strong",{children:v[0]}),e.jsx("span",{children:v[1]})]}),t!=="data"&&e.jsx("button",{type:"button",className:"mx-history-trends__primary",children:"Отметить настроение"})]}),e.jsx("div",{className:"mx-history-trends__insights",children:p.map(y=>e.jsxs("article",{children:[e.jsxs("header",{children:[e.jsxs("div",{children:[e.jsx("strong",{children:y.title}),e.jsx("span",{children:y.note})]}),e.jsx("button",{type:"button","aria-label":"Скрыть карточку",onClick:r(()=>a(C=>[...C,We.indexOf(y)]),"onClick"),children:e.jsx(Ws,{size:15})})]}),t==="data"?e.jsx(qt,{kind:y.kind,breakdown:m}):e.jsxs("div",{className:"mx-history-trends__empty",children:[e.jsx("strong",{children:t==="empty"?"Пока недостаточно данных":"Нужно ещё 4 дня"}),e.jsx("span",{children:t==="empty"?"Сделай чек-ин, чтобы начать наблюдение.":"Прогресс 6 из 10 дней"}),e.jsx("i",{children:e.jsx("b",{style:{width:t==="empty"?"8%":"60%"}})})]})]},y.title))}),s.length>0&&e.jsxs("button",{type:"button",className:"mx-history-trends__restore",onClick:r(()=>a([]),"onClick"),children:["Вернуть скрытые карточки (",s.length,")"]}),e.jsx(er,{state:t,emotions:x,risers:h,fallers:u})]})}r(sr,"TrendsPreview");function ar(){const[s,a]=o.useState("reflect"),[t,i]=o.useState(""),n=[["reflect","Порефлексировать"],["challenge","Оспорить мысль"],["next","Следующий шаг"],["support","Поддержать"]];return e.jsxs("section",{className:"mx-history-trends__section","aria-labelledby":"journal-preview-title",children:[e.jsx(Re,{eyebrow:"Точечное усиление · журнал",title:"Помощь внутри записи",copy:"Именованные режимы делают намерение явным и не конкурируют с персона-системой. Пустой ввод получает мягкую подсказку вместо тихого сбоя."}),e.jsxs("div",{className:"mx-history-trends__journal",children:[e.jsx("div",{className:"mx-history-trends__modes",role:"group","aria-label":"Режим помощи",children:n.map(([l,c])=>e.jsx("button",{type:"button","aria-pressed":s===l,onClick:r(()=>a(l),"onClick"),children:c},l))}),e.jsx("textarea",{value:t,onChange:r(l=>i(l.target.value),"onChange"),placeholder:"Что сейчас занимает твои мысли?","aria-label":"Текст записи"}),e.jsxs("div",{children:[e.jsx("span",{children:t?`Режим: ${n.find(([l])=>l===s)[1]}`:"Можно начать с одного предложения"}),e.jsxs("button",{type:"button",className:"mx-history-trends__primary",onClick:r(()=>i(l=>l||"Напиши одну мысль — я помогу с ней по выбранному режиму."),"onClick"),children:[e.jsx(qs,{size:14})," Помочь"]})]})]})]})}r(ar,"JournalAssistantPreview");function tr(){return e.jsxs("section",{className:"mx-history-trends","aria-labelledby":"history-trends-title",children:[e.jsxs("div",{className:"mx-history-trends__intro",children:[e.jsx("span",{children:"26 · Новые продуктовые поверхности"}),e.jsx("h2",{id:"history-trends-title",children:"История, тренды и помощь в журнале"}),e.jsx("p",{children:"Функциональные паттерны из референса, переосмысленные в визуальном языке Mentalix. Только Preview: API и production не подключены."})]}),e.jsx(Kt,{}),e.jsx(sr,{}),e.jsx(ar,{})]})}r(tr,"HistoryTrendsJournalExperiment");const rr="---\nstatus: working\nlast_verified: 2026-09-16\n---\n# UI Lab — журнал экспериментов\n\nЖурнал отвечает на вопрос: **что проверяли, в каком окружении и что наблюдали**. Продуктовые решения фиксируются отдельно в [`DECISION_LOG.md`](DECISION_LOG.md) и, если меняется политика продукта, в [`docs/core/PRODUCT_DECISIONS.md`](../../core/PRODUCT_DECISIONS.md).\n\n## Статусы\n\n`draft` — гипотеза формируется; `running` — Preview доступен и проверка идёт; `manual-gate` — нужен реальный Telegram/iPhone gate; `concluded` — наблюдения записаны; `promoted` — результат перенесён в production отдельным PR; `archived` — эксперимент закрыт без переноса.\n\n## Реестр\n\n| ID                              | Дата       | Гипотеза / scope                                                                                                                                                                                                                                                                                                                                                                          | Варианты                                          | Evidence                                                                                                                                                                                                                                                                     | Статус        | Следующий шаг                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |\n| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n| `UI-EXP-001`                    | 02.09.2026 | Постоянная Compare-доска упростит сопоставление baseline и экспериментальной версии без затрагивания production                                                                                                                                                                                                                                                                           | Baseline / Experiments / Compare                  | [PR #483](https://github.com/Smira31/Mentalix/pull/483), [PR #489](https://github.com/Smira31/Mentalix/pull/489), [Cloudflare Demo baseline](https://mentalix-owner-qa.pages.dev/?ui_lab=baseline)                                                                        | `concluded`   | **Принять в UI Lab:** владелец подтвердил на реальном iPhone внутри Telegram открытие Baseline, Experiments и Compare; «Рядом» синхронен, состояния переключаются, vertical scroll и top safe area работают, явного horizontal overflow нет. Production promotion не следует из этого результата.                                                                                                                                                                                                                                                                           |\n| `UI-EXP-002`                    | 02.09.2026 | Двухколоночный каталог шести практик с native horizontal swipe даст быстрый обзор без визуального шума и сохранит продолжение списка видимым                                                                                                                                                                                                                                              | Baseline Practices / Preview card catalog         | [PR — UI Lab Practices cards](https://github.com/Smira31/Mentalix/pulls) · локальный Preview `?ui_lab=experiments` · референс [«Вариант F»](https://claude.ai/code/artifact/68ec6594-f63d-4f22-a132-ace00e90c01f)                                                            | `concluded`   | **Принять направление «Ярусный каталог» в UI Lab:** конфликт «Тихая сетка vs horizontal-rail» закрыт в пользу многоярусной композиции каталога «Практики» (герой-баннер, рельс «Новое и рекомендованное», «Тема недели», «Коллекции», bottom-sheet «Чек-ин эмоций»). «Тихая сетка» остаётся для Ритуалов/Аскез/Библиотеки. Это решение не означает production promotion: реализация компонентов и их manual gate на реальном Telegram/iPhone — отдельный следующий шаг.                                                                                                     |\n| `UI-EXP-003`                    | 03.09.2026 | Многоярусный каталог даст Практикам промо-зону, открытие нового контента, тематический фокус, коллекции и контекстный эмоциональный check-in вместо одного вертикального списка                                                                                                                                                                                                           | Production baseline / Layered catalog             | локальный `?ui_lab=practice-catalog` · baseline `ProductionBaseline.jsx` · Preview-only `LayeredPracticeCatalogExperiment.jsx` · референс [«Вариант F»](https://claude.ai/code/artifact/68ec6594-f63d-4f22-a132-ace00e90c01f)                                                | `concluded`   | **Принято владельцем:** подтверждены визуально и функционально все части реализации — рельс «Новое и рекомендованное» (2 карточки в ряд), сетка «Коллекции» (иконка в нижнем ряду карточки рядом с шевроном), drill-down экран категории (hero-блок с капсульной подложкой под иконкой) и флоу «Тема недели» (3 экрана: карточка вопроса → запись дневника → завершение практики). Перенос оформлен отдельным чистым PR из `feat/ui-exp-003-focus-check` в `main`. Часть SemanticGlyph-иллюстраций остаётся черновой/placeholder — финальные иконки добавятся отдельным PR. |\n| `UI-EXP-004`                    | 04.09.2026 | История, Тренды и Журнал с AI-режимами дадут более честные и модульные поверхности, чем текущие списки: хронологическая лента с системными вехами вместо разрозненных экранов (История), скрываемый insight-дашборд, где состояние объясняет следующий шаг (Тренды), именованные режимы усиления записи, не конкурирующие с персона-системой, с мягкой подсказкой на пустой ввод (Журнал) | Preview-only History / Trends / Journal AI-режимы | ветка `feat/ui-lab-history-trends-journal`, [PR #502](https://github.com/Smira31/Mentalix/pull/502) · локальный Preview `?ui_lab=experiments` · `HistoryTrendsJournalExperiment.jsx`                                                                                         | `concluded`   | **Принято владельцем:** ручной Telegram/iPhone gate пройден и подтверждён на реальном устройстве — группировка Истории по дате, режимы Журнала (включая горизонтальный скролл «Поддержать»), расширенные Тренды (hero со средним настроением, месячный график, разбивка по настроению, «Эмоции», подписи дней недели и размер точек календаря) проверены и приняты. Перенос оформлен отдельным чистым PR из `feat/ui-lab-history-trends-journal` в `main` (PR #502 не мержится напрямую).                                                                                   |\n| `MXL-UI-LAB-EVENING-REVIEW-001` | 02.09.2026 | Короткий маршрут «факт → рефлексия → закономерность → шаг на завтра» поможет закрыть день без длинной анкеты                                                                                                                                                                                                                                                                              | Preview-only evening review                       | локальный Preview `?ui_lab=experiments`                                                                                                                                                                                                                                      | `manual-gate` | Проверить на реальном Telegram/iPhone; отдельно подтвердить темп 60–90 секунд, safe areas и ясность одного вопроса/одной CTA на экран. Production promotion не следует из этого результата.                                                                                                                                                                                                                                                                                                                                                                                 |\n| `UI-EXP-005`                    | 09.09.2026 | Перевести визуальную грамматику пяти видео Stoic в Mentalix и проверить новый каталог Библиотеки без изменения production, API и существующих функций                                                                                                                                                                                                                                     | Current Library / Preview-only Library catalog    | [PR #554](https://github.com/Smira31/Mentalix/pull/554) · [Cloudflare Demo — Library](https://mentalix-owner-qa.pages.dev/?ui_lab=library) · [`STOIC_VIDEO_VISUAL_CONTRACT_2026-09-09.md`](STOIC_VIDEO_VISUAL_CONTRACT_2026-09-09.md) · `LibraryExperiment.jsx`                  | `manual-gate` | Проверить на реальном Telegram/iPhone: иерархию, размер карточек, horizontal rail, переходы в «Статьи» и «Направленные записи», disabled «Практикумы» и состояния loading/error/empty/web. Production не менять до явного PASS владельца.                                                                                                                                                                                                                                                                                                                                   |\n| `MXL-PROGRESS-UX-002`           | 09.09.2026 | Альтернативный режим «Наблюдение + следующий шаг»: одна описательная карточка с evidence и безопасным CTA только при однозначном состоянии, без изменения production и API                                                                                                                                                                                                                | Preview-only observation / next-step states       | Issue [#557](https://github.com/Smira31/Mentalix/issues/557) · [PR #561](https://github.com/Smira31/Mentalix/pull/561) · `?ui_lab=progress-observation` · `ProgressObservationExperiment.jsx`                                                                                | `concluded`   | **Принять в UI Lab:** owner подтвердил на iPhone/Telegram все пять состояний, CTA доступна только в confirmed, safe areas и horizontal overflow проверены. Production promotion не следует автоматически; production `Analytics.jsx` и API не изменялись.                                                                                                                                                                                                                                                                                                                   |\n| `MXL-PROGRESS-REDESIGN-001`     | 09.09.2026 | Полный визуальный редизайн вкладки «Прогресс» по видео Stoic: hero с крупным графиком, наблюдения, календарь, эмоции и существующие активности без изменения production/API                                                                                                                                                                                                               | Current Analytics / full Progress redesign        | [Issue #563](https://github.com/Smira31/Mentalix/issues/563) · [PR #564](https://github.com/Smira31/Mentalix/pull/564) · `?ui_lab=progress-redesign` · [`PROGRESS_VISUAL_CONTRACT_2026-09-09.md`](PROGRESS_VISUAL_CONTRACT_2026-09-09.md) · `ProgressRedesignExperiment.jsx` | `concluded`   | **Принято владельцем:** UI Lab проверен и смёржен через PR #564. Production promotion выполняется отдельной веткой и обязана сохранить реальные периоды, cache/API/settings, loading/error/empty, rituals/ascezas и owner gate на production Preview.                                                                                                                                                                                                                                                                                                                       |\n| `MXL-435-UI-LAB-001`            | 11.09.2026 | Тестируем гибрид направлений 1+2 против направления 3 для пикера персон: проверяемое обещание роли + один обратимый шаг vs мягкое знакомство через starter-сценарий                                                                                                                                                                                                                      | Hybrid (напр. 1+2) / Starter (напр. 3)            | [PR #599](https://github.com/Smira31/Mentalix/pull/599) · ветка `feat/mxl-435-mentor-picker-ui-lab` · локальный Preview `?ui_lab=mentor-picker` · `PersonaPickerRedesignExperiment.jsx`                                                                                        | `manual-gate` | Проверить на реальном Telegram/iPhone оба варианта пикера (гибрид и starter); подтвердить snap-скролл, safe areas, понятность CTA и возможность «передумать». Production не менять до явного PASS владельца.                                                                                                                                                                                                                                                                                                                                                               |\n\n## Правила записи результата\n\nДля каждой новой записи использовать [`EXPERIMENT_TEMPLATE.md`](EXPERIMENT_TEMPLATE.md). В реестр добавлять только короткую строку; подробности хранить в отдельном файле `UI-EXP-NNN-<slug>.md` рядом с этим журналом, если их становится больше одной страницы.\n\nРазделяйте факты и интерпретации. Снимок Preview, desktop smoke и автоматический тест подтверждают только соответствующее окружение; они не подтверждают реальный Telegram WebView, safe-area, keyboard или production behaviour.\n\nПосле завершения эксперимента обязательно указать один итог: **принять**, **повторить**, **отложить** или **отклонить**. «Принять» не означает автоматически менять product.\n",ir=`import { useEffect, useRef, useState } from 'react'

import {
  ArrowRight,
  Check,
  ChevronDown,
  Flame,
  Pause,
  Play,
  RotateCcw,
  UserRound,
  X,
} from 'lucide-react'

import { DayArc } from '../Motif'
import SemanticGlyph from '../SemanticGlyph'
import { DayThread, FocusMark, NextActionReveal } from '../TodayMotionExperiment'
import MyPathGlyph from './MyPathGlyph'
import UiLabSwitch from './UiLabSwitch'
import './UiExperiments.css'

const DURATION = 60_000
const PHI = (1 + Math.sqrt(5)) / 2
const BREATH_PHASES = ['вдох', 'пауза', 'выдох', 'пауза']

function makeGoldenSpiralPath() {
  const centerX = 160
  const centerY = 126
  const points = 144

  return Array.from({ length: points }, (_, index) => {
    const angle = (index / (points - 1)) * Math.PI * 3.5
    const radius = 112 * Math.pow(PHI, -angle / (Math.PI / 2))
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)

    return \`\${index === 0 ? 'M' : 'L'}\${x.toFixed(2)} \${y.toFixed(2)}\`
  }).join(' ')
}

const GOLDEN_SPIRAL_PATH = makeGoldenSpiralPath()

function PreviewWeek() {
  const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const today = new Date()
  const monday = new Date(today)

  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  return (
    <div className="mx-lab-today__week">
      {names.map((name, index) => {
        const date = new Date(monday)

        date.setDate(monday.getDate() + index)

        const active = date.toDateString() === today.toDateString()
        const completed = index === Math.max(0, ((today.getDay() + 6) % 7) - 1)

        return (
          <div key={name} data-active={active} data-completed={completed}>
            <span>{name}</span>
            <strong>{completed ? <Check aria-hidden="true" /> : date.getDate()}</strong>
          </div>
        )
      })}
    </div>
  )
}

function TodayScreenPreview({ mode }) {
  const [threadOpen, setThreadOpen] = useState(false)
  const next = {
    title: 'Записать главную мысль',
    meta: 'ритуал',
  }

  return (
    <section className="mx-lab-today-context">
      <div className="mx-lab-today-context__head">
        <span>В контексте приложения</span>
        <h2>Экран «Сегодня»</h2>
        <p>
          Переключатель выше меняет текущую композицию на экспериментальную без изменения данных.
        </p>
      </div>

      <div className="mx-lab-today">
        <div className="mx-lab-today__app-head">
          <span className="mx-lab-today__streak" aria-label="Серия: 1 день">
            <Flame aria-hidden="true" />
            <strong>1</strong>
          </span>
          <strong className="mx-lab-today__greeting">добрый вечер.</strong>
          <button type="button" className="mx-lab-today__profile" aria-label="Профиль">
            <UserRound aria-hidden="true" />
          </button>
        </div>

        <p className="mx-lab-today__tagline">шаг за шагом — выход находится</p>

        <PreviewWeek />

        {mode === 'after' && threadOpen && (
          <DayThread
            checkinDone
            done={1}
            open={threadOpen}
            onOpenChange={setThreadOpen}
            total={3}
            todayState="dayInProgress"
          />
        )}

        <div className="mx-lab-today__hero">
          {mode === 'after' ? (
            <FocusMark />
          ) : (
            <div className="mx-lab-today__art">
              <DayArc state="dayInProgress" done={1} total={3} className="w-full h-full" />
            </div>
          )}

          {mode === 'after' ? (
            <NextActionReveal next={next} remainAfter={2} onStart={() => {}} />
          ) : (
            <div className="mx-lab-today__before-action">
              <small>Самое важное</small>
              <strong>{next.title}</strong>
              <span>{next.meta}</span>
              <button type="button">Начать</button>
              <p>После этого останется: 2</p>
            </div>
          )}
        </div>

        <div className="mx-lab-today__nav" aria-hidden="true">
          {[0, 1, 2, 3, 4].map(item => (
            <span key={item} data-active={item === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function ExperimentShell({ number, eyebrow, title, purpose, mode, children }) {
  return (
    <section id={\`ui-lab-sketch-\${number}\`} className="mx-lab-experiment" data-mode={mode}>
      <div className="mx-lab-experiment__head">
        <span className="mx-lab-experiment__number">{number}</span>

        <div>
          <p className="mx-lab-experiment__eyebrow">{eyebrow}</p>

          <h2>{title}</h2>

          <p className="mx-lab-experiment__purpose">{purpose}</p>
        </div>
      </div>

      <div className="mx-lab-stage">{children}</div>
    </section>
  )
}

function ExpansionExperiment({ mode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <ExperimentShell
      number="01"
      eyebrow="Раскрытие"
      title="Один ближайший шаг"
      purpose="Карточка сохраняет пространственный контекст и раскрывает ровно ту информацию, которая нужна перед началом ритуала."
      mode={mode}
    >
      <div className="mx-lab-expand" data-open={open}>
        <button
          type="button"
          className="mx-lab-expand__trigger"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className="mx-lab-orbit-mark" aria-hidden="true">
            <span />
          </span>

          <span className="mx-lab-expand__copy">
            <small>Ритуал · 5 минут</small>
            <strong>Записать главную мысль</strong>
            <span>Сначала увидеть, потом действовать</span>
          </span>

          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <div className="mx-lab-expand__layer" aria-hidden={!open}>
          <button
            type="button"
            className="mx-lab-expand__backdrop"
            tabIndex={open ? 0 : -1}
            aria-label="Закрыть карточку"
            onClick={() => setOpen(false)}
          />

          <div
            className="mx-lab-expand__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Записать главную мысль"
          >
            <div className="mx-lab-expand__dialog-head">
              <span className="mx-lab-orbit-mark" aria-hidden="true">
                <span />
              </span>

              <button
                type="button"
                className="mx-lab-icon-button"
                tabIndex={open ? 0 : -1}
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <small>Ритуал · 5 минут</small>
            <h3>Записать главную мысль</h3>
            <p>Сформулируй одно предложение: что сегодня действительно требует твоего внимания?</p>

            <div className="mx-lab-expand__prompt">
              Не план на весь день. Только одна ясная мысль.
            </div>

            <button
              type="button"
              className="mx-lab-primary"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              Начать
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </ExperimentShell>
  )
}

function FocusExperiment({ mode }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(22_000)
  const startedAt = useRef(null)

  useEffect(() => {
    if (!running) return undefined

    const timer = window.setInterval(() => {
      const next = Math.min(Date.now() - startedAt.current, DURATION)

      setElapsed(next)

      if (next >= DURATION) {
        setRunning(false)
      }
    }, 100)

    const pauseWhenHidden = () => {
      if (document.hidden) {
        setRunning(false)
      }
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', pauseWhenHidden)
    }
  }, [running])

  const progress = Math.min(elapsed / DURATION, 1)
  const remaining = Math.max(0, Math.ceil((DURATION - elapsed) / 1000))

  return (
    <ExperimentShell
      number="02"
      eyebrow="Атмосфера"
      title="Поле внимания"
      purpose="Геометрия показывает ход короткой фокус-сессии: движение начинается только вместе с таймером и замирает на паузе."
      mode={mode}
    >
      <div className="mx-lab-focus" data-running={running} style={{ '--mx-progress': progress }}>
        <svg
          className="mx-lab-focus__field"
          viewBox="0 0 320 250"
          role="img"
          aria-label={\`Осталось \${remaining} секунд\`}
        >
          <g className="mx-lab-focus__quiet-lines">
            <path d="M40 126H280" />
            <path d="M160 24V226" />
            <circle cx="160" cy="126" r="92" />
            <circle cx="160" cy="126" r="66" />
          </g>

          <g className="mx-lab-focus__moving-field">
            <path d="M72 84A102 102 0 0 1 248 84" />
            <path d="M86 190A96 96 0 0 0 234 190" />
          </g>

          <circle className="mx-lab-focus__track" cx="160" cy="126" r="48" />

          <circle
            className="mx-lab-focus__progress"
            cx="160"
            cy="126"
            r="48"
            pathLength="1"
            style={{
              strokeDashoffset: 1 - progress,
            }}
          />

          <g
            className="mx-lab-focus__marker"
            style={{
              transform: \`rotate(\${progress * 360}deg)\`,
            }}
          >
            <circle cx="160" cy="78" r="3.5" />
          </g>

          <circle className="mx-lab-focus__center" cx="160" cy="126" r="3" />
        </svg>

        <div className="mx-lab-focus__readout">
          <small>{running ? 'Сессия идёт' : 'Короткий фокус'}</small>
          <strong>0:{String(remaining).padStart(2, '0')}</strong>
          <span>одна задача · без переключений</span>
        </div>

        <div className="mx-lab-focus__actions">
          <button
            type="button"
            className="mx-lab-primary"
            onClick={() => {
              if (running) {
                setRunning(false)
                return
              }

              startedAt.current = Date.now() - elapsed
              setRunning(true)
            }}
          >
            {running ? <Pause size={17} /> : <Play size={17} />}
            {running ? 'Пауза' : 'Продолжить'}
          </button>

          <button
            type="button"
            className="mx-lab-icon-button"
            aria-label="Начать заново"
            onClick={() => {
              setRunning(false)
              setElapsed(0)
            }}
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>
    </ExperimentShell>
  )
}

function CompletionExperiment({ mode }) {
  const [complete, setComplete] = useState(false)

  return (
    <ExperimentShell
      number="03"
      eyebrow="Micro-interaction"
      title="Ритуал услышал действие"
      purpose="Нажатие сразу подтверждается, а завершённое состояние остаётся спокойным и однозначным — без конфетти и декоративного шума."
      mode={mode}
    >
      <div className="mx-lab-completion" data-complete={complete}>
        <div className="mx-lab-completion__art" aria-hidden="true">
          <svg viewBox="0 0 140 100">
            <circle cx="70" cy="50" r="33" />
            <path d="M26 50H114" />
            <path d="M70 14V86" />
            <path className="mx-lab-completion__check" d="m55 50 10 10 22-24" />
            <circle className="mx-lab-completion__point" cx="103" cy="50" r="3.5" />
          </svg>
        </div>

        <div className="mx-lab-completion__copy">
          <small>{complete ? 'Отмечено сегодня' : 'Утренний ритуал'}</small>
          <h3>Стакан воды</h3>
          <p>
            {complete
              ? 'Шаг учтён. Ничего больше не требуется.'
              : 'Маленькое действие перед началом дня.'}
          </p>
        </div>

        <button
          type="button"
          className="mx-lab-complete-button"
          onClick={() => setComplete(current => !current)}
        >
          <span className="mx-lab-complete-button__icon">
            <Check size={17} />
          </span>
          <span>{complete ? 'Готово' : 'Отметить'}</span>
        </button>
      </div>
    </ExperimentShell>
  )
}

function BreathingExperiment({ mode }) {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return undefined

    const timer = window.setInterval(() => {
      setPhase(current => (current + 1) % BREATH_PHASES.length)
    }, 3_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [active])

  return (
    <ExperimentShell
      number="04"
      eyebrow="SVG + motion"
      title="Дыхательный ориентир"
      purpose="Фирменные дуги объясняют фазу упражнения. Движение не украшает экран, а заменяет необходимость постоянно читать таймер."
      mode={mode}
    >
      <div className="mx-lab-breath" data-active={active} data-phase={phase}>
        <div className="mx-lab-breath__visual">
          <svg viewBox="0 0 240 240" aria-hidden="true">
            <g className="mx-lab-breath__rays">
              <path d="M120 18V42" />
              <path d="m48 48 17 17" />
              <path d="M18 120H42" />
              <path d="m48 192 17-17" />
              <path d="M120 222V198" />
              <path d="m192 192-17-17" />
              <path d="M222 120H198" />
              <path d="m192 48-17 17" />
            </g>

            <circle
              className="mx-lab-breath__ring mx-lab-breath__ring--outer"
              cx="120"
              cy="120"
              r="72"
            />
            <circle
              className="mx-lab-breath__ring mx-lab-breath__ring--inner"
              cx="120"
              cy="120"
              r="47"
            />
            <path className="mx-lab-breath__arc" d="M120 48a72 72 0 0 1 72 72" />
            <circle className="mx-lab-breath__core" cx="120" cy="120" r="8" />
          </svg>

          <div className="mx-lab-breath__label" aria-live="polite">
            <small>{active ? 'Следуй за кругом' : 'Практика · 1 минута'}</small>
            <strong>{active ? BREATH_PHASES[phase] : 'готов?'}</strong>
          </div>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => {
            setActive(current => !current)
            if (active) setPhase(0)
          }}
        >
          {active ? <Pause size={17} /> : <Play size={17} />}
          {active ? 'Остановить' : 'Начать дыхание'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function CheckinExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)

  const labels = ['бережно', 'ровно', 'есть импульс']

  return (
    <ExperimentShell
      number="05"
      eyebrow="State prototype"
      title="Состояние отвечает формой"
      purpose="Rive-подобная логика без чужого визуала: одна иллюстрация меняет состояние вслед за выбором энергии и подтверждает, что чек-ин понят."
      mode={mode}
    >
      <div className="mx-lab-checkin" data-energy={energy}>
        <div className="mx-lab-checkin__visual" aria-hidden="true">
          <svg viewBox="0 0 300 190">
            <g className="mx-lab-checkin__horizon">
              <path d="M32 95H268" />
              <circle cx="150" cy="95" r="62" />
            </g>

            <g className="mx-lab-checkin__orbit mx-lab-checkin__orbit--one">
              <ellipse cx="150" cy="95" rx="98" ry="32" />
            </g>

            <g className="mx-lab-checkin__orbit mx-lab-checkin__orbit--two">
              <ellipse cx="150" cy="95" rx="82" ry="46" />
            </g>

            <g className="mx-lab-checkin__needle">
              <path d="M150 95 150 45" />
              <circle cx="150" cy="42" r="4" />
            </g>

            <circle className="mx-lab-checkin__core" cx="150" cy="95" r="8" />
          </svg>
        </div>

        <div className="mx-lab-checkin__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>

        <div className="mx-lab-checkin__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function GoldenSpiralExperiment({ mode }) {
  const [drawKey, setDrawKey] = useState(0)

  return (
    <ExperimentShell
      number="06"
      eyebrow="Пропорция φ"
      title="Спираль внимания"
      purpose="Каждая четверть оборота уменьшается в φ раз. Линия не просто украшает экран — она показывает, как широкое поле внимания последовательно сводится к одной мысли."
      mode={mode}
    >
      <div className="mx-lab-phi mx-lab-phi-spiral">
        <div className="mx-lab-phi__visual">
          <svg
            viewBox="0 0 320 252"
            role="img"
            aria-label="Золотая спираль сужается к точке внимания"
          >
            <g className="mx-lab-phi__guides">
              <path d="M24 126H296" />
              <path d="M160 20V232" />
              <rect x="48" y="57" width="224" height="138.44" rx="4" />
              <circle cx="160" cy="126" r="42.8" />
            </g>

            <path key={drawKey} className="mx-lab-phi-spiral__path" d={GOLDEN_SPIRAL_PATH} />

            <circle className="mx-lab-phi__core" cx="160" cy="126" r="4" />
          </svg>
        </div>

        <div className="mx-lab-phi__copy">
          <small>φ = 1.618</small>
          <strong>От поля — к одной точке</strong>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDrawKey(value => value + 1)}
        >
          <RotateCcw size={17} />
          Дорисовать снова
        </button>
      </div>
    </ExperimentShell>
  )
}

function GoldenEllipseExperiment({ mode }) {
  const [running, setRunning] = useState(false)

  return (
    <ExperimentShell
      number="07"
      eyebrow="Золотая орбита"
      title="Ритм без случайных пропорций"
      purpose="Большая и малая оси орбиты соотносятся как 1.618. Точка движется только во время фокус-сессии и делает её ход видимым без отдельного таймера в центре."
      mode={mode}
    >
      <div className="mx-lab-phi mx-lab-phi-ellipse" data-running={running && mode === 'after'}>
        <div className="mx-lab-phi__visual mx-lab-phi-ellipse__visual">
          <svg
            viewBox="0 0 320 252"
            role="img"
            aria-label="Эллиптическая орбита с пропорцией золотого сечения"
          >
            <g className="mx-lab-phi__guides">
              <path d="M36 126H284" />
              <path d="M160 40V212" />
              <rect x="55" y="61.1" width="210" height="129.8" rx="4" />
            </g>

            <ellipse className="mx-lab-phi-ellipse__orbit" cx="160" cy="126" rx="105" ry="64.9" />

            <ellipse className="mx-lab-phi-ellipse__inner" cx="160" cy="126" rx="64.9" ry="40.1" />

            <circle className="mx-lab-phi-ellipse__center" cx="160" cy="126" r="3" />
          </svg>

          <span className="mx-lab-phi-ellipse__marker" aria-hidden="true" />
        </div>

        <div className="mx-lab-phi__copy">
          <small>210 ÷ 129.8 = 1.618</small>
          <strong>{running ? 'Фокус удерживается' : 'Орбита ждёт действия'}</strong>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setRunning(value => !value)}
        >
          {running ? <Pause size={17} /> : <Play size={17} />}
          {running ? 'Пауза' : 'Начать фокус'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function GoldenApertureExperiment({ mode }) {
  const [depth, setDepth] = useState(0)
  const radii = [104, 64.3, 39.7, 24.5]

  return (
    <ExperimentShell
      number="08"
      eyebrow="Собственная идея"
      title="Золотая диафрагма"
      purpose="Четыре уровня внимания уменьшаются последовательно по φ. Нажатие не запускает декоративный цикл, а буквально сужает область выбора до следующего уровня."
      mode={mode}
    >
      <div className="mx-lab-phi mx-lab-phi-aperture" data-depth={depth}>
        <div className="mx-lab-phi__visual">
          <svg viewBox="0 0 320 252" role="img" aria-label={\`Глубина фокуса: \${depth + 1} из 4\`}>
            <g className="mx-lab-phi__guides">
              <path d="M32 126H288" />
              <path d="M160 22V230" />
            </g>

            {radii.map((radius, index) => (
              <g
                key={radius}
                className="mx-lab-phi-aperture__ring"
                data-ring={index}
                data-reached={index <= depth}
              >
                <path d={\`M\${160 - radius} 126A\${radius} \${radius} 0 0 1 \${160 + radius} 126\`} />
                <path d={\`M\${160 + radius} 126A\${radius} \${radius} 0 0 1 \${160 - radius} 126\`} />
              </g>
            ))}

            <circle className="mx-lab-phi__core" cx="160" cy="126" r="4" />
          </svg>
        </div>

        <div className="mx-lab-phi__copy">
          <small>Уровень {depth + 1} · радиус ÷ φ</small>
          <strong>{depth === 3 ? 'Осталась одна точка' : 'Сузить область выбора'}</strong>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDepth(value => (value + 1) % radii.length)}
        >
          {depth === 3 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {depth === 3 ? 'Начать снова' : 'Следующий уровень'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function SoftFacetExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)
  const labels = ['бережно', 'ровно', 'есть импульс']

  return (
    <ExperimentShell
      number="09"
      eyebrow="Мягкая геометрия"
      title="Состояние получает огранку"
      purpose="Альтернатива круговой «Энергии сейчас»: пересекающиеся линзы сохраняют мягкость, а четыре спокойные вершины показывают направленность выбранного состояния."
      mode={mode}
    >
      <div className="mx-lab-facet" data-energy={energy}>
        <div className="mx-lab-facet__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-facet__guides">
              <path d="M32 126H288" />
              <path d="M160 24V228" />
            </g>

            <path
              className="mx-lab-facet__frame"
              d="M160 24C190 55 230 88 282 126C230 164 190 197 160 228C130 197 90 164 38 126C90 88 130 55 160 24Z"
            />

            <g className="mx-lab-facet__lenses">
              <path d="M48 126C86 72 234 72 272 126C234 180 86 180 48 126Z" />
              <path d="M160 34C214 70 214 182 160 218C106 182 106 70 160 34Z" />
            </g>

            <g className="mx-lab-facet__needle">
              <path d="M160 126L160 67" />
              <circle cx="160" cy="62" r="4" />
            </g>

            <circle className="mx-lab-facet__core" cx="160" cy="126" r="6" />
          </svg>
        </div>

        <div className="mx-lab-facet__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>

        <div className="mx-lab-facet__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function FillingRitualExperiment({ mode }) {
  const [complete, setComplete] = useState(false)

  return (
    <ExperimentShell
      number="10"
      eyebrow="Альтернатива ритуалу"
      title="Шаг наполняет форму"
      purpose="Более выразительная замена простому знаку стакана: завершение утреннего действия спокойно наполняет сосуд и оставляет видимый след без конфетти."
      mode={mode}
    >
      <div className="mx-lab-vessel" data-complete={complete}>
        <div className="mx-lab-vessel__visual">
          <svg
            viewBox="0 0 320 252"
            role="img"
            aria-label={complete ? 'Утренний ритуал завершён' : 'Утренний ритуал ожидает действия'}
          >
            <defs>
              <clipPath id="mx-lab-vessel-clip">
                <path d="M82 55C90 157 112 205 160 220C208 205 230 157 238 55Z" />
              </clipPath>
            </defs>

            <g className="mx-lab-vessel__guides">
              <path d="M46 55H274" />
              <path d="M160 24V228" />
            </g>

            <g className="mx-lab-vessel__water" clipPath="url(#mx-lab-vessel-clip)">
              <path className="mx-lab-vessel__fill" d="M64 118H256V236H64Z" />
              <path d="M64 118C100 102 124 134 160 118C196 102 220 134 256 118" />
              <path d="M76 151C108 137 130 165 160 151C190 137 212 165 244 151" />
            </g>

            <path
              className="mx-lab-vessel__body"
              d="M82 55C90 157 112 205 160 220C208 205 230 157 238 55"
            />
            <path
              className="mx-lab-vessel__rim"
              d="M82 55C112 43 208 43 238 55C208 67 112 67 82 55Z"
            />

            <g className="mx-lab-vessel__drop">
              <path d="M160 30C151 42 148 48 160 56C172 48 169 42 160 30Z" />
              <circle cx="160" cy="49" r="3" />
            </g>
          </svg>
        </div>

        <div className="mx-lab-vessel__copy">
          <small>{complete ? 'Отмечено сегодня' : 'Утренний ритуал'}</small>
          <strong>Стакан воды</strong>
          <span>
            {complete ? 'Форма заполнена — шаг учтён.' : 'Одно спокойное действие для начала дня.'}
          </span>
        </div>

        <button
          type="button"
          className="mx-lab-complete-button"
          onClick={() => setComplete(value => !value)}
        >
          <span className="mx-lab-complete-button__icon">
            <Check size={17} />
          </span>
          <span>{complete ? 'Готово' : 'Отметить'}</span>
        </button>
      </div>
    </ExperimentShell>
  )
}

function PetalBreathingExperiment({ mode }) {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return undefined

    const timer = window.setInterval(() => {
      setPhase(current => (current + 1) % BREATH_PHASES.length)
    }, 3_000)

    return () => window.clearInterval(timer)
  }, [active])

  return (
    <ExperimentShell
      number="11"
      eyebrow="Линзы и лепестки"
      title="Дыхание раскрывается формой"
      purpose="Вместо ещё одного круга четыре линзы раскрываются на вдохе и собираются на выдохе. Движение остаётся инструкцией практики, а не фоновым украшением."
      mode={mode}
    >
      <div className="mx-lab-petal" data-active={active} data-phase={phase}>
        <div className="mx-lab-petal__visual">
          <svg viewBox="0 0 320 252" aria-hidden="true">
            <g className="mx-lab-petal__guides">
              <path d="M42 126H278" />
              <path d="M160 20V232" />
              <path d="M82 48L238 204" />
              <path d="M238 48L82 204" />
            </g>

            <path
              className="mx-lab-petal__frame"
              d="M160 30C190 68 226 96 272 126C226 156 190 184 160 222C130 184 94 156 48 126C94 96 130 68 160 30Z"
            />

            <g className="mx-lab-petal__petals">
              <path d="M160 126C128 94 132 52 160 28C188 52 192 94 160 126Z" />
              <path d="M160 126C192 94 234 98 258 126C234 154 192 158 160 126Z" />
              <path d="M160 126C192 158 188 200 160 224C132 200 128 158 160 126Z" />
              <path d="M160 126C128 158 86 154 62 126C86 98 128 94 160 126Z" />
            </g>

            <circle className="mx-lab-petal__halo" cx="160" cy="126" r="34" />
            <circle className="mx-lab-petal__core" cx="160" cy="126" r="6" />
          </svg>

          <div className="mx-lab-petal__label" aria-live="polite">
            <small>{active ? 'Следуй за формой' : 'Практика · 1 минута'}</small>
            <strong>{active ? BREATH_PHASES[phase] : 'готов?'}</strong>
          </div>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => {
            setActive(value => !value)
            if (active) setPhase(0)
          }}
        >
          {active ? <Pause size={17} /> : <Play size={17} />}
          {active ? 'Остановить' : 'Начать дыхание'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function ChoiceLensExperiment({ mode }) {
  const [depth, setDepth] = useState(0)
  const labels = ['Широкое поле', 'Только важное', 'Одна мысль']

  return (
    <ExperimentShell
      number="12"
      eyebrow="Референс · линза"
      title="Выбор становится уже"
      purpose="Три мягкие линзы заменяют привычную мишень: каждый шаг убирает лишнее и оставляет более точную область решения."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-choice-lens" data-depth={depth}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M28 126H292" />
              <path d="M160 26V226" />
            </g>
            <path
              className="mx-lab-choice-lens__shape"
              data-lens="0"
              d="M32 126C82 48 238 48 288 126C238 204 82 204 32 126Z"
            />
            <path
              className="mx-lab-choice-lens__shape"
              data-lens="1"
              d="M68 126C106 76 214 76 252 126C214 176 106 176 68 126Z"
            />
            <path
              className="mx-lab-choice-lens__shape"
              data-lens="2"
              d="M108 126C130 101 190 101 212 126C190 151 130 151 108 126Z"
            />
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="5" />
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>Уровень выбора {depth + 1} из 3</small>
          <strong>{labels[depth]}</strong>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDepth(value => (value + 1) % labels.length)}
        >
          {depth === 2 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {depth === 2 ? 'Сначала' : 'Сузить выбор'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function LivingContourExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)
  const labels = ['тихо', 'устойчиво', 'живой импульс']

  return (
    <ExperimentShell
      number="13"
      eyebrow="Референс · контур"
      title="Энергия меняет границу"
      purpose="Не круг и не ромб, а мягкая мембрана: выбранная энергия меняет её напряжение, наклон и внутреннее пространство."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-contour" data-energy={energy}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M34 126H286" />
              <path d="M160 24V228" />
            </g>
            <g className="mx-lab-contour__membrane">
              <path d="M160 28C216 32 276 72 278 126C276 180 216 220 160 224C104 220 44 180 42 126C44 72 104 32 160 28Z" />
              <path d="M160 58C202 60 244 88 246 126C244 164 202 192 160 194C118 192 76 164 74 126C76 88 118 60 160 58Z" />
            </g>
            <g className="mx-lab-contour__axis">
              <path d="M103 157L217 95" />
              <path d="M112 102L208 150" />
            </g>
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="6" />
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>
        <div className="mx-lab-ref__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function BreathingWaveExperiment({ mode }) {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return undefined
    const timer = window.setInterval(() => {
      setPhase(value => (value + 1) % BREATH_PHASES.length)
    }, 3_000)
    return () => window.clearInterval(timer)
  }, [active])

  return (
    <ExperimentShell
      number="14"
      eyebrow="Референс · волна"
      title="Дыхание проходит через линию"
      purpose="Две волны расходятся на вдохе и возвращаются на выдохе. Такой ориентир мягче лепестков и подходит для спокойной ежедневной практики."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-wave" data-active={active} data-phase={phase}>
        <div className="mx-lab-ref__visual mx-lab-wave__visual">
          <svg viewBox="0 0 320 252" aria-hidden="true">
            <g className="mx-lab-ref__guides">
              <path d="M26 126H294" />
              <path d="M160 34V218" />
            </g>
            <g className="mx-lab-wave__upper">
              <path d="M30 126C68 74 108 74 146 126C184 178 224 178 290 126" />
              <path d="M46 126C82 94 114 94 150 126C186 158 218 158 274 126" />
            </g>
            <g className="mx-lab-wave__lower">
              <path d="M30 126C68 178 108 178 146 126C184 74 224 74 290 126" />
              <path d="M46 126C82 158 114 158 150 126C186 94 218 94 274 126" />
            </g>
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="5" />
          </svg>
          <div className="mx-lab-wave__label" aria-live="polite">
            <small>{active ? 'Следуй за волной' : 'Практика · 1 минута'}</small>
            <strong>{active ? BREATH_PHASES[phase] : 'готов?'}</strong>
          </div>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => {
            setActive(value => !value)
            if (active) setPhase(0)
          }}
        >
          {active ? <Pause size={17} /> : <Play size={17} />}
          {active ? 'Остановить' : 'Начать дыхание'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function FibonacciRouteExperiment({ mode }) {
  const [step, setStep] = useState(0)
  const points = [
    [58, 194],
    [96, 194],
    [96, 156],
    [158, 156],
    [158, 94],
    [258, 94],
  ]
  const [x, y] = points[step]

  return (
    <ExperimentShell
      number="15"
      eyebrow="Референс · Fibonacci"
      title="Шаги складываются в маршрут"
      purpose="Последовательность 1·1·2·3·5 превращается в путь практики: золотая точка переходит только после реального следующего шага."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-route" data-step={step}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides mx-lab-route__blocks">
              <rect x="40" y="176" width="36" height="36" />
              <rect x="76" y="176" width="36" height="36" />
              <rect x="76" y="140" width="72" height="72" />
              <rect x="148" y="104" width="108" height="108" />
            </g>
            <path className="mx-lab-route__path" d="M58 194H96V156H158V94H258" />
            {points.map(([pointX, pointY], index) => (
              <circle
                key={\`\${pointX}-\${pointY}\`}
                className="mx-lab-route__node"
                data-reached={index <= step}
                cx={pointX}
                cy={pointY}
                r="3"
              />
            ))}
            <g className="mx-lab-route__marker" style={{ transform: \`translate(\${x}px, \${y}px)\` }}>
              <circle r="6" />
            </g>
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>
            Шаг {step + 1} из {points.length}
          </small>
          <strong>{step === points.length - 1 ? 'Маршрут собран' : 'Следующий шаг виден'}</strong>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setStep(value => (value + 1) % points.length)}
        >
          {step === points.length - 1 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {step === points.length - 1 ? 'Пройти снова' : 'Сделать шаг'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function NextStepGateExperiment({ mode }) {
  const [open, setOpen] = useState(false)

  return (
    <ExperimentShell
      number="16"
      eyebrow="Референс · портал"
      title="Следующий шаг открывается"
      purpose="Две вертикальные дуги расходятся только после решения начать. Композиция показывает переход к действию без карточки, круга или декоративной сцены."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-gate" data-open={open}>
        <div className="mx-lab-ref__visual mx-lab-gate__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M34 126H286" />
              <path d="M160 22V230" />
            </g>
            <g className="mx-lab-gate__side mx-lab-gate__side--left">
              <path d="M56 32C138 58 138 194 56 220" />
              <path d="M88 52C142 76 142 176 88 200" />
            </g>
            <g className="mx-lab-gate__side mx-lab-gate__side--right">
              <path d="M264 32C182 58 182 194 264 220" />
              <path d="M232 52C178 76 178 176 232 200" />
            </g>
            <path className="mx-lab-gate__path" d="M160 70V182" />
            <circle className="mx-lab-ref__core mx-lab-gate__core" cx="160" cy="126" r="6" />
          </svg>
          <div className="mx-lab-gate__label">
            <small>{open ? 'Путь открыт' : 'Ближайшее действие'}</small>
            <strong>{open ? 'Начать практику' : 'Записать главную мысль'}</strong>
          </div>
        </div>
        <button type="button" className="mx-lab-primary" onClick={() => setOpen(value => !value)}>
          {open ? <X size={17} /> : <ArrowRight size={17} />}
          {open ? 'Закрыть' : 'Открыть шаг'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function FlowRouteExperiment({ mode }) {
  const [step, setStep] = useState(0)
  const points = [
    [48, 176],
    [126, 76],
    [204, 176],
    [274, 104],
  ]
  const labels = ['Начало видно', 'Первый поворот', 'Ритм удержан', 'Шаг завершён']
  const [x, y] = points[step]

  return (
    <ExperimentShell
      number="17"
      eyebrow="Новый референс маршрута"
      title="Путь течёт, а не складывается"
      purpose="Альтернатива ступенчатому Fibonacci-маршруту: одна непрерывная нить мягко проводит через четыре действия и сохраняет ощущение движения вперёд."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-flow-route" data-step={step}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M28 126H292" />
              <path d="M160 26V226" />
            </g>
            <path
              className="mx-lab-flow-route__echo"
              d="M48 176C88 176 82 76 126 76S166 176 204 176S238 104 274 104"
            />
            <path
              className="mx-lab-flow-route__path"
              d="M48 176C88 176 82 76 126 76S166 176 204 176S238 104 274 104"
            />
            {points.map(([pointX, pointY], index) => (
              <g
                key={\`\${pointX}-\${pointY}\`}
                className="mx-lab-flow-route__node"
                data-reached={index <= step}
              >
                <path d={\`M\${pointX - 12} \${pointY}H\${pointX + 12}\`} />
                <circle cx={pointX} cy={pointY} r="3" />
              </g>
            ))}
            <g
              className="mx-lab-flow-route__marker"
              style={{ transform: \`translate(\${x}px, \${y}px)\` }}
            >
              <circle r="6" />
            </g>
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>
            Этап {step + 1} из {points.length}
          </small>
          <strong>{labels[step]}</strong>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setStep(value => (value + 1) % points.length)}
        >
          {step === points.length - 1 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {step === points.length - 1 ? 'Пройти снова' : 'Следующий этап'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function ResonanceExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)
  const labels = ['тихий отклик', 'ровный резонанс', 'живой импульс']

  return (
    <ExperimentShell
      number="18"
      eyebrow="Новый референс энергии"
      title="Импульс раскрывает крылья"
      purpose="Вместо замкнутой мембраны энергия расходится от центральной оси двумя волнами. Чем больше импульс, тем шире пространство действия."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-resonance" data-energy={energy}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M30 126H290" />
              <path d="M160 24V228" />
            </g>
            <g className="mx-lab-resonance__wing mx-lab-resonance__wing--left">
              <path d="M156 126C126 94 92 70 42 68C72 104 72 148 42 184C92 182 126 158 156 126Z" />
              <path d="M146 126C118 108 94 102 70 104C88 126 88 126 70 148C94 150 118 144 146 126Z" />
            </g>
            <g className="mx-lab-resonance__wing mx-lab-resonance__wing--right">
              <path d="M164 126C194 94 228 70 278 68C248 104 248 148 278 184C228 182 194 158 164 126Z" />
              <path d="M174 126C202 108 226 102 250 104C232 126 232 126 250 148C226 150 202 144 174 126Z" />
            </g>
            <path className="mx-lab-resonance__spine" d="M160 54V198" />
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="6" />
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>
        <div className="mx-lab-ref__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function SemanticAtlasExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const cards = [
    { label: 'Стакан воды', meta: 'утренний ритуал' },
    { label: 'Главная мысль', meta: 'фокус дня' },
    { label: 'Дыхание', meta: 'восстановление' },
    { label: 'Тихая прогулка', meta: 'практика' },
  ]

  const marks = [
    <svg key="water" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M34 18C38 58 46 70 60 74C74 70 82 58 86 18" />
      <path d="M34 18C47 13 73 13 86 18C73 23 47 23 34 18Z" />
      <path d="M39 48C50 43 70 53 81 48" />
      <circle cx="60" cy="39" r="3" />
    </svg>,
    <svg key="thought" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M22 58C40 28 80 28 98 58C80 48 40 48 22 58Z" />
      <path d="M60 22V62" />
      <path d="M40 34L60 22L80 34" />
      <circle cx="60" cy="22" r="3" />
    </svg>,
    <svg key="breath" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M60 42C46 30 48 15 60 8C72 15 74 30 60 42Z" />
      <path d="M60 42C74 30 89 32 96 42C89 52 74 54 60 42Z" />
      <path d="M60 42C74 54 72 69 60 76C48 69 46 54 60 42Z" />
      <path d="M60 42C46 54 31 52 24 42C31 32 46 30 60 42Z" />
      <circle cx="60" cy="42" r="3" />
    </svg>,
    <svg key="walk" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M16 60C34 60 32 24 50 24S68 60 84 60S98 38 106 38" />
      <path d="M16 68H106" />
      <circle cx="50" cy="24" r="3" />
    </svg>,
  ]

  return (
    <ExperimentShell
      number="19"
      eyebrow="Система смысловых рисунков"
      title="У каждой карточки свой знак"
      purpose="Принцип стакана воды превращается в систему: рисунок показывает смысл конкретного действия, но остаётся частью единого языка тонких линий Mentalix."
      mode={mode}
    >
      <div className="mx-lab-atlas">
        <div className="mx-lab-atlas__grid">
          {cards.map((card, index) => (
            <button
              type="button"
              key={card.label}
              className="mx-lab-atlas__card"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <span className="mx-lab-atlas__mark">{marks[index]}</span>
              <small>{card.meta}</small>
              <strong>{card.label}</strong>
            </button>
          ))}
        </div>
        <p className="mx-lab-atlas__note">
          Выбран знак: <strong>{cards[selected].label}</strong>
        </p>
      </div>
    </ExperimentShell>
  )
}

function RitualCardsExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const rituals = [
    {
      title: 'Утренняя молитва',
      meta: 'намерение перед началом дня',
      kind: 'prayer',
    },
    {
      title: 'Холодный душ',
      meta: 'пробуждение через действие',
      kind: 'shower',
    },
    {
      title: 'Зачем ты проснулся',
      meta: 'возвращение к смыслу дня',
      kind: 'purpose',
    },
  ]

  const drawings = rituals.map((ritual, index) => (
    <SemanticGlyph
      key={ritual.kind}
      kind={ritual.kind}
      animated={selected === index}
      highlighted={selected === index}
    />
  ))

  return (
    <ExperimentShell
      number="20"
      eyebrow="Ваши ритуалы"
      title="Три действия — три собственных знака"
      purpose="Каждая карточка буквально переводит смысл ритуала в геометрию. Нажатие выбирает действие и запускает только связанную с ним короткую реакцию формы."
      mode={mode}
    >
      <div className="mx-lab-ritual-cards">
        {rituals.map((ritual, index) => (
          <button
            type="button"
            key={ritual.title}
            className="mx-lab-ritual-card"
            data-kind={ritual.kind}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span className="mx-lab-ritual-card__art">{drawings[index]}</span>
            <span className="mx-lab-ritual-card__copy">
              <small>{selected === index ? 'Выбранный ритуал' : 'Утренний ритуал'}</small>
              <strong>{ritual.title}</strong>
              <span>{ritual.meta}</span>
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </ExperimentShell>
  )
}

function AscezaCardsExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const ascezas = [
    {
      title: 'Отказ от алкоголя',
      meta: 'ясность вместо привычного импульса',
      kind: 'alcohol',
    },
    {
      title: 'Отказ от курения',
      meta: 'свободное дыхание без дыма',
      kind: 'smoking',
    },
    {
      title: 'Осознанный отказ',
      meta: 'прямой курс остаётся сильнее бокового импульса',
      kind: 'asceza',
    },
  ]

  const drawings = ascezas.map((asceza, index) => (
    <SemanticGlyph
      key={asceza.kind}
      kind={asceza.kind}
      animated={selected === index}
      highlighted={selected === index}
    />
  ))

  return (
    <ExperimentShell
      number="21"
      eyebrow="Ваши аскезы"
      title="Отказ тоже получает ясный знак"
      purpose="Три карточки показывают не запрет ради запрета, а выбранное направление: линия решения пересекает алкоголь, дым исчезает из разорванной привычки, а общий знак удерживает прямой курс при угасающем боковом импульсе."
      mode={mode}
    >
      <div className="mx-lab-asceza-cards">
        {ascezas.map((asceza, index) => (
          <button
            type="button"
            key={asceza.title}
            className="mx-lab-asceza-card"
            data-kind={asceza.kind}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span className="mx-lab-asceza-card__art">{drawings[index]}</span>
            <span className="mx-lab-asceza-card__copy">
              <small>{selected === index ? 'Выбранная аскеза' : 'Личная аскеза'}</small>
              <strong>{asceza.title}</strong>
              <span>{asceza.meta}</span>
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </ExperimentShell>
  )
}

function SemanticSystemCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      className="mx-lab-system-card"
      data-kind={item.kind}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="mx-lab-system-card__art">
        <SemanticGlyph kind={item.kind} animated={selected} highlighted={selected} />
      </span>
      <span className="mx-lab-system-card__copy">
        <small>{selected ? item.activeLabel : item.label}</small>
        <strong>{item.title}</strong>
        <span>{item.meta}</span>
      </span>
    </button>
  )
}

function SemanticSystemGrid({ items }) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="mx-lab-system-grid" data-count={items.length}>
      {items.map((item, index) => (
        <SemanticSystemCard
          key={item.title}
          item={item}
          selected={selected === index}
          onSelect={() => setSelected(index)}
        />
      ))}
    </div>
  )
}

function PracticeSystemExperiment({ mode }) {
  const items = [
    {
      title: 'Нейротренажёр',
      meta: 'связи собираются в один ясный маршрут',
      kind: 'neuro',
      label: 'тренировка связи',
      activeLabel: 'связь активна',
    },
    {
      title: 'Дыхание',
      meta: 'две доли освобождают место для вдоха',
      kind: 'breath',
      label: 'практика дыхания',
      activeLabel: 'идёт вдох',
    },
    {
      title: 'Фокус',
      meta: 'поле сужается до выбранной точки',
      kind: 'focus',
      label: 'инструмент внимания',
      activeLabel: 'фокус найден',
    },
    {
      title: 'Медитация',
      meta: 'внутренние волны возвращаются к тишине',
      kind: 'meditation',
      label: 'практика тишины',
      activeLabel: 'внимание осело',
    },
  ]

  return (
    <ExperimentShell
      number="22"
      eyebrow="Практики Mentalix"
      title="У каждого инструмента — собственная работа формы"
      purpose="Не набор абстрактных кругов, а четыре понятных процесса: нейронная связь собирается, дыхание раскрывается, оптика фокуса сужается, а волны медитации оседают. Нажмите на карточку, чтобы увидеть её смысловое состояние."
      mode={mode}
    >
      <SemanticSystemGrid items={items} />
    </ExperimentShell>
  )
}

function MentorSystemExperiment({ mode }) {
  const items = [
    {
      title: 'Наставник',
      meta: 'помогает сверить направление',
      kind: 'mentor',
      label: 'роль проводника',
      activeLabel: 'курс выстроен',
    },
    {
      title: 'Собеседник',
      meta: 'слышит и возвращает мысль яснее',
      kind: 'companion',
      label: 'роль диалога',
      activeLabel: 'контакт установлен',
    },
    {
      title: 'Следопыт',
      meta: 'показывает следующий достижимый след',
      kind: 'pathfinder',
      label: 'роль маршрута',
      activeLabel: 'след найден',
    },
  ]

  return (
    <ExperimentShell
      number="23"
      eyebrow="Раздел наставника"
      title="Три роли говорят разной геометрией"
      purpose="Наставник выстраивает курс, Собеседник соединяет две стороны разговора, Следопыт проводит живую точку к следующему следу. Так роль считывается ещё до текста и не превращается в безымянную декоративную иконку."
      mode={mode}
    >
      <SemanticSystemGrid items={items} />
    </ExperimentShell>
  )
}

function ArticleSystemExperiment({ mode }) {
  const items = [
    {
      title: 'Тревога',
      meta: 'распутать напряжение до ровной опоры',
      kind: 'anxiety',
      label: 'тема состояния',
      activeLabel: 'контур распутан',
    },
    {
      title: 'Сон',
      meta: 'закрыть внешний контур и отпустить день',
      kind: 'sleep',
      label: 'тема восстановления',
      activeLabel: 'контур закрыт',
    },
    {
      title: 'Новая тема',
      meta: 'каркас для будущей функции или статьи',
      kind: 'template',
      label: 'расширяемая система',
      activeLabel: 'смысл собран',
    },
  ]

  return (
    <ExperimentShell
      number="24"
      eyebrow="Статьи и новые функции"
      title="Тема получает знак из своего внутреннего действия"
      purpose="Тревога распутывается в опору, сон мягко закрывает внешний контур, а модульная рамка показывает правило для будущих тем: сначала определяется смысл действия, затем вокруг него строится уникальная геометрия."
      mode={mode}
    >
      <SemanticSystemGrid items={items} />
    </ExperimentShell>
  )
}

function MyPathCardExperiment({ mode }) {
  const [drawKey, setDrawKey] = useState(0)

  return (
    <ExperimentShell
      number="25"
      eyebrow="Askeza / Ritual · «Мой путь»"
      title="Путь нарисован сразу — движется точка, а не линия"
      purpose="Линии показаны сразу полностью и статично — путь уже существует. Акцентная точка едет по готовому маршруту, и тонкий золотой оверлей растёт следом за ней до её текущей позиции: «иду по пути», а не «путь рисуется»."
      mode={mode}
    >
      <div className="mx-lab-my-path">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '180px' }}>
            <MyPathGlyph key={\`progress-\${drawKey}\`} animated={mode === 'after'} />
          </div>
        </div>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(var(--c-line), 0.16)',
          }}
        >
          <p
            style={{ fontSize: '0.8rem', opacity: 0.68, textAlign: 'center', marginBottom: '1rem' }}
          >
            Акцентный цвет — вариант для сравнения (закреплён в PR #143)
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <MyPathGlyph key={\`primary-\${drawKey}\`} animated={mode === 'after'} />
              <small style={{ opacity: 0.68 }}>Основной (золото)</small>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <MyPathGlyph
                key={\`secondary-\${drawKey}\`}
                animated={mode === 'after'}
                accent="secondary"
              />
              <small style={{ opacity: 0.68 }}>Вариант (#C77D7A)</small>
            </div>
          </div>
        </div>

        <div className="mx-lab-my-path__copy">
          <small>Пилот · только ui-lab</small>
          <strong>Мой путь</strong>
          <span>
            В прод не деплоится — карточка ждёт отдельного решения о переносе в Askeza/Ritual.
          </span>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDrawKey(value => value + 1)}
        >
          <RotateCcw size={17} />
          Проиграть снова
        </button>
      </div>
    </ExperimentShell>
  )
}

function RitualAscezaStylesExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const rituals = [
    { title: 'Стакан воды', kind: 'ritual', variant: 'primary' },
    { title: 'Стакан воды', kind: 'ritual', variant: 'secondary' },
    { title: 'Аскеза', kind: 'asceza', variant: 'primary' },
    { title: 'Аскеза', kind: 'asceza', variant: 'secondary' },
  ]

  return (
    <ExperimentShell
      number="26"
      eyebrow="Стиль Ritual & Askeza"
      title="Два цветовых варианта для различения категорий"
      purpose="Золотой акцент (основной) для Askeza/Ritual. Медный/лиловый акцент (вариант) для будущих категорий (например, Наставник). Оба варианта показаны рядом. Не деплоится в прод — только в ui-lab (при ?ui_lab=1)."
      mode={mode}
    >
      <div
        className="mx-lab-styles-comparison"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}
      >
        {rituals.map((ritual, index) => (
          <div
            key={\`\${ritual.kind}-\${ritual.variant}\`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(var(--c-line), 0.24)',
              cursor: 'pointer',
            }}
            onClick={() => setSelected(index)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') setSelected(index)
            }}
            role="button"
            tabIndex={0}
          >
            <div style={{ width: '80px', height: '80px' }}>
              <SemanticGlyph
                kind={ritual.kind}
                animated={selected === index}
                highlighted={selected === index}
                accent={ritual.variant === 'secondary' ? 'secondary' : undefined}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <small style={{ opacity: 0.68 }}>
                {ritual.variant === 'primary' ? 'Основной' : 'Вариант'}
              </small>
              <strong style={{ display: 'block' }}>{ritual.title}</strong>
              <span style={{ fontSize: '0.875rem', opacity: 0.56 }}>{ritual.kind}</span>
            </div>
          </div>
        ))}
      </div>
    </ExperimentShell>
  )
}

export default function UiExperiments({ embedded = false }) {
  const [mode, setMode] = useState('after')

  useEffect(() => {
    const targetId = window.location.hash.slice(1)
    if (!targetId) return undefined

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId)
      if (!target) return

      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      target.dataset.highlight = 'true'
      window.setTimeout(() => delete target.dataset.highlight, 1800)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <main className="mx-lab" data-mode={mode}>
      {!embedded && (
        <header className="mx-lab-header">
          <div className="mx-lab-header__mark" aria-hidden="true">
            <span />
          </div>
          <p className="mx-lab-kicker">Mentalix · лаборатория интерфейса</p>
          <UiLabSwitch active="experiments" />
          <h1>Движение, которое помогает сделать шаг.</h1>

          <p className="mx-lab-intro">
            Двадцать пять изолированных прототипов. Они не меняют продуктовые данные и доступны
            только в режиме разработки.
          </p>

          <div className="mx-lab-toggle" role="group" aria-label="Сравнение вариантов">
            <span className="mx-lab-toggle__indicator" data-side={mode} aria-hidden="true" />

            <button
              type="button"
              aria-pressed={mode === 'before'}
              onClick={() => setMode('before')}
            >
              Текущий
            </button>

            <button type="button" aria-pressed={mode === 'after'} onClick={() => setMode('after')}>
              Эксперимент
            </button>
          </div>

          <p className="mx-lab-mode-note" aria-live="polite">
            {mode === 'after'
              ? 'Анимация объясняет состояние и подтверждает действие.'
              : 'Состояния переключаются без пространственного и тактильного контекста.'}
          </p>
        </header>
      )}
      {!embedded && <TodayScreenPreview mode={mode} />}

      <div className="mx-lab-list">
        <ExpansionExperiment mode={mode} />
        <FocusExperiment mode={mode} />
        <CompletionExperiment mode={mode} />
        <BreathingExperiment mode={mode} />
        <CheckinExperiment mode={mode} />
        <GoldenSpiralExperiment mode={mode} />
        <GoldenEllipseExperiment mode={mode} />
        <GoldenApertureExperiment mode={mode} />
        <SoftFacetExperiment mode={mode} />
        <FillingRitualExperiment mode={mode} />
        <PetalBreathingExperiment mode={mode} />
        <ChoiceLensExperiment mode={mode} />
        <LivingContourExperiment mode={mode} />
        <BreathingWaveExperiment mode={mode} />
        <FibonacciRouteExperiment mode={mode} />
        <NextStepGateExperiment mode={mode} />
        <FlowRouteExperiment mode={mode} />
        <ResonanceExperiment mode={mode} />
        <SemanticAtlasExperiment mode={mode} />
        <RitualCardsExperiment mode={mode} />
        <AscezaCardsExperiment mode={mode} />
        <PracticeSystemExperiment mode={mode} />
        <MentorSystemExperiment mode={mode} />
        <ArticleSystemExperiment mode={mode} />
        <MyPathCardExperiment mode={mode} />
        <RitualAscezaStylesExperiment mode={mode} />
      </div>

      <footer className="mx-lab-footer">
        <span />
        Прототипы не подключены к API
        <span />
      </footer>
    </main>
  )
}
`,nr=new Set(["pending review","manual-gate"]),lr=new Set(["concluded","promoted","archived"]);function cr(s){return s.replace(/\[([^\]]+)\]\([^)]*\)/g,"$1").replace(/\*\*/g,"").trim()}r(cr,"cleanCell");function or(){return rr.split(`
`).filter(s=>s.startsWith("| `")).map(s=>{const a=s.split("|").slice(1,-1).map(cr),[t,i,n,l,c,d]=a;return{id:t.replace(/`/g,""),date:i,scope:n,variants:l,status:d.replace(/`/g,"").toLowerCase()}}).filter(s=>s.id&&s.status)}r(or,"parseJournal");function dr(){const s=/number="(\d+)"[\s\S]{0,420}?title="([^"]+)"/g;return Array.from(ir.matchAll(s),a=>({number:a[1].padStart(2,"0"),title:a[2],href:`?ui_lab=experiments#ui-lab-sketch-${a[1].padStart(2,"0")}`}))}r(dr,"parsePatterns");const mr={"UI-EXP-001":"?ui_lab=compare","UI-EXP-002":"?ui_lab=experiments","UI-EXP-003":"?ui_lab=practice-catalog","UI-EXP-005":"?ui_lab=library","MXL-UI-LAB-EVENING-REVIEW-001":"?ui_lab=experiments","MXL-PROGRESS-UX-002":"?ui_lab=progress-observation","MXL-PROGRESS-REDESIGN-001":"?ui_lab=progress-redesign","MXL-435-UI-LAB-001":"?ui_lab=mentor-picker"},Ns=or().map(s=>({...s,href:mr[s.id]||"?ui_lab=experiments"})),pe=Ns.filter(s=>nr.has(s.status)),qe=Ns.filter(s=>lr.has(s.status)),Ke=dr();function xr(s){return s==="manual-gate"?"manual-gate":s}r(xr,"statusLabel");function Je(s){return s.replace(/^Постоянная /,"").replace(/^Короткий маршрут /,"")}r(Je,"formatScope");function hr({status:s}){return e.jsx("span",{className:`mx-ui-lab-status mx-ui-lab-status--${s.replace(/\s+/g,"-")}`,children:xr(s)})}r(hr,"StatusBadge");function ue({eyebrow:s,status:a,title:t,description:i,href:n,meta:l}){return e.jsxs("a",{className:"mx-ui-lab-card",href:n,children:[e.jsxs("span",{className:"mx-ui-lab-card__eyebrow-row",children:[e.jsx("span",{className:"mx-ui-lab-card__eyebrow",children:s}),a&&e.jsx(hr,{status:a})]}),e.jsx("strong",{children:t}),e.jsx("span",{className:"mx-ui-lab-card__description",children:i}),e.jsx("span",{className:"mx-ui-lab-card__meta",children:l})]})}r(ue,"CatalogCard");function pr(){return e.jsxs("div",{className:"mx-ui-lab-empty",children:[e.jsx("strong",{children:"Пока нет активных экспериментов"}),e.jsx("span",{children:"Новые записи появятся здесь автоматически после добавления в журнал."})]})}r(pr,"EmptyState");function ur(){return e.jsxs("section",{className:"mx-ui-lab-hub","aria-labelledby":"ui-lab-hub-title",children:[e.jsxs("div",{className:"mx-ui-lab-hub__intro",children:[e.jsx("span",{className:"mx-ui-lab__kicker",children:"Точка входа · каталог"}),e.jsx("h2",{id:"ui-lab-hub-title",children:"Куда пойти в UI Lab"}),e.jsx("p",{children:"Формальные проверки отделены от паттернов-эскизов. Карточка открывает существующий маршрут без изменения самого эксперимента."})]}),e.jsxs("section",{className:"mx-ui-lab-catalog-section","aria-labelledby":"active-experiments-title",children:[e.jsxs("div",{className:"mx-ui-lab-catalog-section__heading",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"mx-ui-lab__kicker",children:["Журнал · ",pe.length]}),e.jsx("h3",{id:"active-experiments-title",children:"Активные эксперименты"})]}),e.jsx("p",{children:"Pending review и manual-gate"})]}),pe.length?e.jsx("div",{className:"mx-ui-lab-card-grid",children:pe.map(s=>e.jsx(ue,{eyebrow:s.id,status:s.status,title:Je(s.scope),description:s.variants,href:s.href,meta:"Открыть Preview →"},s.id))}):e.jsx(pr,{})]}),e.jsxs("section",{className:"mx-ui-lab-catalog-section","aria-labelledby":"sketch-patterns-title",children:[e.jsxs("div",{className:"mx-ui-lab-catalog-section__heading",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"mx-ui-lab__kicker",children:["Галерея идей · ",Ke.length]}),e.jsx("h3",{id:"sketch-patterns-title",children:"Паттерны и эскизы"})]}),e.jsx("p",{children:"Небольшие пронумерованные наброски"})]}),e.jsx("div",{className:"mx-ui-lab-card-grid",children:Ke.map(s=>e.jsx(ue,{eyebrow:`Эскиз ${s.number}`,title:s.title,description:"Идея интерфейсного паттерна, без отдельного решения в журнале.",href:s.href,meta:"Открыть в экспериментах →"},s.number))})]}),e.jsxs("details",{className:"mx-ui-lab-archive",children:[e.jsxs("summary",{children:[e.jsxs("span",{children:[e.jsxs("span",{className:"mx-ui-lab__kicker",children:["История · ",qe.length]}),e.jsx("strong",{children:"Архив"})]}),e.jsx("span",{children:"Завершённые эксперименты"})]}),e.jsx("div",{className:"mx-ui-lab-card-grid",children:qe.map(s=>e.jsx(ue,{eyebrow:s.id,status:s.status,title:Je(s.scope),description:s.variants,href:s.href,meta:"Открыть маршрут →"},s.id))})]})]})}r(ur,"UiLabHub");const we=[{id:"one-step",eyebrow:"Фокус",title:"Как начать с одного шага",description:"Короткий материал о действии без лишнего давления.",kind:"focus"},{id:"inner-support",eyebrow:"Поддержка",title:"Как говорить с собой бережнее",description:"Заметь внутренний тон и выбери более точные слова.",kind:"purpose"},{id:"evening-pause",eyebrow:"Рефлексия",title:"Спокойно завершить день",description:"Несколько минут, чтобы отпустить незавершённое.",kind:"journal"}],br=[{id:"decision",eyebrow:"4 вопроса",title:"Разобраться в решении",description:"Отдели факты от предположений и найди следующий шаг.",kind:"focus"},{id:"week",eyebrow:"5 вопросов",title:"Подвести итог недели",description:"Увидь главное без ощущения отчётности.",kind:"journal"}],jr=[["ready","Готово"],["loading","Загрузка"],["error","Ошибка"],["empty","Пусто"],["web","Web"]];function ee({kind:s}){return e.jsx(w,{kind:s,animated:!1})}r(ee,"Glyph");function _r(){const s=[["Сегодня",ms],["Практики",xs],["Диалог",hs],["Библиотека",ps],["Прогресс",us]];return e.jsx("nav",{className:"mx-library-lab__bottom-nav","aria-label":"Демо основной навигации",children:s.map(([a,t])=>e.jsxs("span",{"data-active":a==="Библиотека"?"true":void 0,children:[e.jsx(t,{size:18,strokeWidth:1.7}),e.jsx("small",{children:a})]},a))})}r(_r,"BottomNavigation$1");function gr({value:s,onChange:a,onClose:t}){return e.jsxs("label",{className:"mx-library-lab__search",children:[e.jsx(ke,{size:17,"aria-hidden":"true"}),e.jsx("input",{autoFocus:!0,value:s,onChange:r(i=>a(i.target.value),"onChange"),placeholder:"Найти материал","aria-label":"Найти материал"}),e.jsx("button",{type:"button",onClick:t,"aria-label":"Закрыть поиск",children:e.jsx(Ce,{size:17})})]})}r(gr,"SearchField");function yr({articles:s,onOpen:a}){return e.jsx("div",{className:"mx-library-lab__rail","aria-label":"Материалы для тебя",children:s.map(t=>e.jsxs("button",{type:"button",className:"mx-library-lab__feature-card",onClick:r(()=>a(t),"onClick"),children:[e.jsx("span",{className:"mx-library-lab__feature-art","aria-hidden":"true",children:e.jsx(ee,{kind:t.kind})}),e.jsx("span",{className:"mx-library-lab__eyebrow",children:t.eyebrow}),e.jsx("strong",{children:t.title}),e.jsx("small",{children:t.description})]},t.id))})}r(yr,"ArticleRail");function be({title:s,description:a,kind:t,soon:i=!1,onClick:n}){return e.jsxs("button",{type:"button",className:"mx-library-lab__collection",disabled:i,onClick:n,"aria-label":i?`${s}, скоро`:`Открыть ${s}`,children:[i&&e.jsx("span",{className:"mx-library-lab__soon",children:"СКОРО"}),e.jsx("strong",{children:s}),e.jsx("small",{children:a}),e.jsx("span",{className:"mx-library-lab__collection-art","aria-hidden":"true",children:e.jsx(ee,{kind:t})}),!i&&e.jsx(E,{className:"mx-library-lab__collection-arrow",size:17})]})}r(be,"CollectionCard");function vr({state:s,onRetry:a}){return s==="loading"?e.jsxs("div",{className:"mx-library-lab__status","aria-label":"Загрузка библиотеки",children:[e.jsx("i",{}),e.jsx("i",{}),e.jsx("i",{})]}):s==="error"?e.jsxs("div",{className:"mx-library-lab__message",role:"alert",children:[e.jsx("strong",{children:"Библиотека не загрузилась"}),e.jsx("p",{children:"Проверь соединение — сохранённые данные не изменились."}),e.jsx("button",{type:"button",onClick:a,children:"Повторить"})]}):s==="empty"?e.jsxs("div",{className:"mx-library-lab__message",children:[e.jsx("strong",{children:"Здесь появятся твои материалы"}),e.jsx("p",{children:"Новые статьи и направленные записи будут собраны в одном месте."})]}):s==="web"?e.jsxs("div",{className:"mx-library-lab__message",children:[e.jsx("strong",{children:"Статьи доступны в браузере"}),e.jsx("p",{children:"Направленные записи открой в Telegram — там сохраняется твой контекст."})]}):null}r(vr,"StatusSurface");function fr({state:s,searchOpen:a,query:t,setQuery:i,setSearchOpen:n,onCollection:l,onArticle:c}){const d=o.useMemo(()=>{const m=t.trim().toLowerCase();return m?we.filter(x=>`${x.title} ${x.description} ${x.eyebrow}`.toLowerCase().includes(m)):we},[t]);return e.jsxs(e.Fragment,{children:[e.jsxs("header",{className:"mx-library-lab__header",children:[e.jsx("h2",{children:"библиотека."}),e.jsx("button",{type:"button",onClick:r(()=>n(!0),"onClick"),"aria-label":"Открыть поиск",children:e.jsx(ke,{size:20})})]}),a&&e.jsx(gr,{value:t,onChange:i,onClose:r(()=>{n(!1),i("")},"onClose")}),s==="ready"?e.jsxs(e.Fragment,{children:[e.jsxs("section",{className:"mx-library-lab__section",children:[e.jsxs("div",{className:"mx-library-lab__section-head",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Выбрано для тебя"}),e.jsx("h3",{children:"Материалы на сейчас"})]}),e.jsx("small",{children:d.length})]}),d.length>0?e.jsx(yr,{articles:d,onOpen:c}):e.jsxs("div",{className:"mx-library-lab__message mx-library-lab__message--search",children:[e.jsx("strong",{children:"Ничего не найдено"}),e.jsx("p",{children:"Попробуй более короткий запрос."}),e.jsx("button",{type:"button",onClick:r(()=>i(""),"onClick"),children:"Очистить поиск"})]})]}),e.jsxs("section",{className:"mx-library-lab__section",children:[e.jsxs("div",{className:"mx-library-lab__section-head",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Всё в одном месте"}),e.jsx("h3",{children:"Коллекции"})]}),e.jsx("small",{children:"3"})]}),e.jsxs("div",{className:"mx-library-lab__collections",children:[e.jsx(be,{title:"Статьи",description:"Короткие материалы, которые помогают перейти к действию.",kind:"purpose",onClick:r(()=>l("articles"),"onClick")}),e.jsx(be,{title:"Направленные записи",description:"Готовые вопросы и личные шаблоны для рефлексии.",kind:"journal",onClick:r(()=>l("journals"),"onClick")}),e.jsx(be,{title:"Практикумы",description:"Большие материалы для последовательной работы.",kind:"focus",soon:!0})]})]})]}):e.jsx(vr,{state:s,onRetry:r(()=>{},"onRetry")})]})}r(fr,"Home");function Nr({type:s,onBack:a,onArticle:t}){const i=s==="articles",n=i?we:br;return e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"mx-library-lab__back",onClick:a,"aria-label":"Назад",children:e.jsx(R,{size:19})}),e.jsxs("header",{className:"mx-library-lab__collection-header",children:[e.jsx("span",{children:"Коллекция"}),e.jsx("h2",{children:i?"Статьи.":"Направленные записи."}),e.jsx("p",{children:i?"Короткие материалы Mentalix — без мотивационного шума.":"Вопросы, которые помогают заметить главное и сохранить свой ответ."})]}),e.jsx("div",{className:"mx-library-lab__catalog-grid",children:n.map(l=>e.jsxs("button",{type:"button",className:"mx-library-lab__catalog-card",onClick:r(()=>i&&t(l),"onClick"),children:[e.jsx("span",{className:"mx-library-lab__eyebrow",children:l.eyebrow}),e.jsx("strong",{children:l.title}),e.jsx("small",{children:l.description}),e.jsx("span",{className:"mx-library-lab__catalog-art","aria-hidden":"true",children:e.jsx(ee,{kind:l.kind})}),e.jsx(E,{size:16,"aria-hidden":"true"})]},l.id))})]})}r(Nr,"Collection");function wr({article:s,onBack:a}){return e.jsxs("article",{className:"mx-library-lab__reader",children:[e.jsx("button",{type:"button",className:"mx-library-lab__back",onClick:a,"aria-label":"К статьям",children:e.jsx(R,{size:19})}),e.jsxs("span",{className:"mx-library-lab__eyebrow",children:[s.eyebrow," · 4 минуты"]}),e.jsx("h2",{children:s.title}),e.jsx("p",{className:"mx-library-lab__reader-lead",children:s.description}),e.jsx("div",{className:"mx-library-lab__reader-art","aria-hidden":"true",children:e.jsx(ee,{kind:s.kind})}),e.jsx("p",{children:"Не пытайся охватить всё сразу. Выбери действие, которое можно начать без дополнительной подготовки, и проверь его на практике."}),e.jsx("p",{children:"После этого вернись к результату: что стало легче, где появилось сопротивление и какой шаг теперь выглядит честным."})]})}r(wr,"Reader");function Cr(){const[s,a]=o.useState("ready"),[t,i]=o.useState("home"),[n,l]=o.useState(null),[c,d]=o.useState(!1),[m,x]=o.useState("");function h(u=s){a(u),i("home"),l(null),d(!1),x("")}return r(h,"reset"),e.jsxs("section",{className:"mx-library-lab","aria-labelledby":"mx-library-lab-title",children:[e.jsxs("div",{className:"mx-library-lab__intro",children:[e.jsx("span",{children:"UI-EXP-005 · Issue #526 · Preview-only"}),e.jsx("h2",{id:"mx-library-lab-title",children:"Библиотека: Stoic-ритм, функции Mentalix"}),e.jsx("p",{children:"Это визуальный прототип. Статьи, направленные записи и disabled-практикумы сохраняют действующие продуктовые границы; production не изменён."})]}),e.jsx("div",{className:"mx-library-lab__state-switch","aria-label":"Состояние демо",children:jr.map(([u,p])=>e.jsx("button",{type:"button","aria-pressed":s===u,onClick:r(()=>h(u),"onClick"),children:p},u))}),e.jsxs("div",{className:"mx-library-lab__device",children:[e.jsxs("div",{className:"mx-library-lab__top-safe","aria-hidden":"true",children:[e.jsx("span",{children:"MENTALIX"}),e.jsx(Ks,{size:17})]}),e.jsx("div",{className:"mx-library-lab__scroll",children:n?e.jsx(wr,{article:n,onBack:r(()=>l(null),"onBack")}):t==="home"?e.jsx(fr,{state:s,searchOpen:c,query:m,setQuery:x,setSearchOpen:d,onCollection:i,onArticle:l}):e.jsx(Nr,{type:t,onBack:r(()=>i("home"),"onBack"),onArticle:l})},n?`article-${n.id}`:`${t}-${s}`),e.jsx(_r,{})]})]})}r(Cr,"LibraryExperiment");const kr=[["Границы без лишнего напряжения","journal","Сказать «нет» без чувства вины"],["Неделя внимательного решения","purpose","Семь дней, чтобы разложить выбор по полочкам"],["Неделя внутреннего порядка","focus","Навести ясность в делах без спешки"]],M=[{id:"one-step",eyebrow:"Фокус",title:"Как начать с одного шага",duration:"6 минут",kind:"focus",intro:"Когда задача разрастается в голове, первый шаг часто теряется среди всех следующих.",situation:"Ты открываешь список дел и уже устаёшь от того, сколько всего нужно удержать в уме.",thought:"Маленький шаг — это не компромисс с целью. Это способ вернуть ей форму, с которой можно работать.",example:"Вместо «разобраться с проектом» можно открыть один документ и выписать три вопроса, на которые нужен ответ сегодня.",blocks:[["Назови участок","Отметь, что именно сейчас требует внимания. Не объясняй всю ситуацию — назови один участок, на который можно посмотреть прямо сегодня."],["Отдели своё","Раздели то, что зависит от тебя сегодня, и то, что пока остаётся внешним условием. Так контекст перестаёт давить целиком."],["Оставь продолжение","Выбери действие до десяти минут. После него можно снова оценить ситуацию, не обещая себе весь результат заранее."]],tryToday:"Запиши один следующий шаг и поставь ему таймер на десять минут.",quote:"Ясность иногда начинается не с ответа, а с честно выбранного масштаба.",closing:"Начни не со всей дороги — с места, где ты уже стоишь."},{id:"inner-support",eyebrow:"Поддержка",title:"Как говорить с собой бережнее",duration:"8 минут",kind:"purpose",intro:"Жёсткость редко помогает стать лучше. Чаще она просто отнимает силы.",situation:"После ошибки ты прокручиваешь разговор и замечаешь, что внутренний голос звучит громче самой ситуации.",thought:"Бережность не отменяет ответственность. Она помогает не тратить силы на самонаказание.",example:"Фразу «я всё испортил» можно заменить на «в разговоре я пропустил важный вопрос; завтра я его задам».",blocks:[["Заметь формулировку","Поймай слова «я всегда», «у меня не получится», «надо было раньше». Переведи их в наблюдаемый факт без приговора."],["Добавь контекст","Спроси, какие обстоятельства были рядом. Контекст не отменяет ответственности, но делает описание ситуации честнее."],["Оставь рабочие слова","Выбери формулировку, с которой можно сделать следующий шаг: «сейчас я знаю…», «мне нужно уточнить…»."]],tryToday:"Поймай одну жёсткую фразу и перепиши её как факт, который можно проверить.",quote:"Поддержать себя — не значит закрыть глаза. Это значит смотреть без лишнего шума.",closing:"Тон, которым ты к себе обращаешься, тоже часть пути."},{id:"evening-pause",eyebrow:"Рефлексия",title:"Спокойно завершить день",duration:"5 минут",kind:"journal",intro:"Вечерняя пауза не обязана подводить идеальный итог. Ей достаточно вернуть дню его очертания.",situation:"День закончился, но отдельные разговоры и незавершённые дела продолжают звучать фоном.",thought:"Завершение — это не оценка дня. Это маленькая граница между тем, что уже произошло, и тем, что можно оставить на завтра.",example:"Можно записать: «Сегодня я отложил звонок. Завтра первым делом уточню время». Этого достаточно, чтобы не носить всё в голове.",blocks:[["Собери факты","Запиши два события дня без оценки. Это могут быть разговор, задача, решение или момент, который заметил только ты."],["Назови остаток","Что осталось в мыслях? Одно предложение достаточно. Не обязательно доводить его до вывода прямо сейчас."],["Поставь точку","Выбери простой знак завершения: убрать одну вещь, записать первый шаг на завтра или закрыть заметку."]],tryToday:"Запиши два факта дня и один первый шаг на завтра — без разбора и самооценки.",quote:"Иногда день заканчивается не решением, а аккуратно поставленной точкой.",closing:"Оставь завтрашнему себе не груз, а одну ясную нитку."}],ws="mentalix-library-journal-entry-v1",z="clarify-choice",Ye="mentalix-library-reader-swipe-hint-v1",$=["Что именно вы сейчас пытаетесь решить?","Какие факты вы знаете точно?","Что для вас важнее всего в этом выборе?","Какой небольшой следующий шаг можно сделать сейчас?"],Sr=r(()=>$.map(()=>""),"emptyAnswers");function Qe(){try{const s=JSON.parse(window.sessionStorage.getItem(ws)||"null");return!s||!Array.isArray(s.answers)||s.answers.length!==$.length?null:{answers:$.map((a,t)=>typeof s.answers[t]=="string"?s.answers[t]:""),step:Math.max(0,Math.min($.length-1,Number(s.step)||0)),status:s.status==="completed"?"completed":"draft"}}catch{return null}}r(Qe,"readSavedEntry");function q(s,a,t="draft"){window.sessionStorage.setItem(ws,JSON.stringify({answers:[...s],step:a,status:t,updatedAt:new Date().toISOString()}))}r(q,"saveEntry");function es(){return new URLSearchParams(window.location.search)}r(es,"params");function Er(s,a={}){const t=new URLSearchParams({ui_lab:"library-programs",review:"1"});return s!=="landing"&&t.set("screen",s),Object.entries(a).forEach(([i,n])=>{n!=null&&n!==""&&t.set(i,String(n))}),`?${t}`}r(Er,"urlFor");function Mr(){return e.jsxs("div",{className:"mx-library-programs__safe","aria-hidden":"true",children:[e.jsx("span",{children:"MENTALIX"}),e.jsx("span",{})]})}r(Mr,"SafeArea");function Cs(){return e.jsx("span",{className:"mx-library-programs__program-glyph",children:e.jsx(w,{kind:"focus",animated:!1})})}r(Cs,"ProgramGlyph");function Pr({onOpen:s}){return e.jsxs("button",{type:"button",className:"mx-library-programs__featured",onClick:r(()=>s("Самодисциплина"),"onClick"),children:[e.jsx("div",{className:"mx-library-programs__featured-art","aria-hidden":"true",children:e.jsx(Cs,{})}),e.jsxs("div",{className:"mx-library-programs__featured-copy",children:[e.jsx("strong",{children:"Самодисциплина"}),e.jsx("p",{children:"Выстроить устойчивый ритм и доводить важное до конца без давления на себя."})]})]})}r(Pr,"FeaturedProgram");function Ar({onOpen:s}){return e.jsx("div",{className:"mx-library-programs__program-rail","aria-label":"Другие программы",children:kr.map(([a,t,i])=>e.jsxs("button",{type:"button",onClick:r(()=>s(a),"onClick"),className:"mx-library-programs__rail-card",children:[e.jsx("span",{className:"mx-library-programs__rail-avatar","aria-hidden":"true",children:e.jsx(w,{kind:t,animated:!1})}),e.jsx("strong",{children:a}),e.jsx("small",{children:i})]},a))})}r(Ar,"ProgramRail");function Lr({article:s,onRead:a}){return e.jsxs("button",{type:"button",className:"w-full rounded-3xl bg-emerald mb-3 text-left border border-cream/10 p-4 transition-transform active:scale-[0.99]",onClick:r(()=>a(s.id),"onClick"),children:[e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx(Ee,{article:s,className:"w-[112px] h-[132px] shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0 py-0.5",children:[s.eyebrow&&e.jsx("span",{className:"inline-block text-[10px] text-gold border border-gold/25 rounded-full px-2.5 py-0.5 mb-2 whitespace-nowrap",children:s.eyebrow}),e.jsx("div",{className:"font-display mx-type-article-title text-cream",children:s.title}),e.jsx("p",{className:"mx-type-article-body text-muted mt-2 line-clamp-3",children:s.intro})]})]}),e.jsxs("div",{className:"flex items-center gap-2 mt-4 pt-3.5 border-t border-cream/8",children:[e.jsx("span",{className:"mx-type-article-action text-gold",children:"Читать статью"}),e.jsx(E,{size:14,className:"text-gold shrink-0",strokeWidth:2}),e.jsx("span",{className:"mx-type-article-meta text-faint ml-auto whitespace-nowrap",children:s.duration})]})]})}r(Lr,"ArticleCard");function Rr({onBack:s,onRead:a}){return e.jsxs("div",{className:"mx-library-programs__articles-list",children:[e.jsx("button",{type:"button",className:"mx-library-programs__back",onClick:s,"aria-label":"Назад",children:e.jsx(R,{size:19})}),e.jsx("header",{className:"mx-library-programs__articles-list-header",children:e.jsx("h2",{children:"Статьи"})}),e.jsx("div",{className:"mx-library-programs__articles-list-items",children:M.map(t=>e.jsx(Lr,{article:t,onRead:a},t.id))})]})}r(Rr,"ArticlesList");function Ir({onOpen:s}){const a=M[0];return e.jsxs("button",{type:"button",className:"mx-library-programs__featured",onClick:s,children:[e.jsx("div",{className:"mx-library-programs__featured-art",children:e.jsx(Ee,{article:a,className:"h-full w-full"})}),e.jsxs("div",{className:"mx-library-programs__featured-copy",children:[e.jsx("strong",{children:a.title}),e.jsx("p",{children:a.intro})]})]})}r(Ir,"ArticleLandingCard");function Tr(){return e.jsxs("nav",{className:"mx-library-programs__bottom","aria-label":"Основная навигация",children:[e.jsx("span",{children:"Сегодня"}),e.jsx("span",{children:"Шаги"}),e.jsx("span",{children:"Диалог"}),e.jsx("span",{"aria-current":"page",children:"Библиотека"}),e.jsx("span",{children:"Прогресс"})]})}r(Tr,"BottomNav");function Dr({onOpenDetail:s,onOpenArticles:a,onOpenJournals:t}){return e.jsxs("div",{className:"mx-library-programs__landing",children:[e.jsx("header",{className:"mx-library-programs__topbar",children:e.jsx("h2",{children:"библиотека."})}),e.jsxs("section",{className:"mx-library-programs__section",children:[e.jsx("div",{className:"mx-library-programs__section-title",children:e.jsx("h3",{children:"Программы"})}),e.jsx(Pr,{onOpen:s}),e.jsx(Ar,{onOpen:s})]}),e.jsxs("section",{className:"mx-library-programs__section",children:[e.jsx("div",{className:"mx-library-programs__section-title",children:e.jsx("h3",{children:"Статьи"})}),e.jsx(Ir,{onOpen:a})]}),e.jsxs("section",{className:"mx-library-programs__section",children:[e.jsx("div",{className:"mx-library-programs__section-title",children:e.jsx("h3",{children:"Направленные записи"})}),e.jsxs("button",{type:"button",className:"mx-library-programs__featured mx-library-programs__featured-journal",onClick:t,children:[e.jsx("span",{className:"mx-library-programs__featured-art","aria-hidden":"true",children:e.jsx(w,{kind:"journal",animated:!1})}),e.jsxs("span",{className:"mx-library-programs__featured-copy",children:[e.jsx("strong",{children:"Направленные записи"}),e.jsx("p",{children:"Короткие письменные практики, которые помогают прояснить мысли и сохранить важное"})]})]}),e.jsxs("div",{className:"mx-library-programs__guided-list","aria-label":"Другие направленные записи",children:[e.jsxs("button",{type:"button",className:"mx-library-programs__guided-list-row",onClick:t,children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Новая запись"}),e.jsx("small",{children:"4 вопроса · 5–7 минут"})]}),e.jsx("span",{"aria-hidden":"true",children:"→"})]}),e.jsxs("button",{type:"button",className:"mx-library-programs__guided-list-row",onClick:t,children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Вернуться к записи"}),e.jsx("small",{children:"Сохранённые ответы и следующий шаг"})]}),e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})]})]})}r(Dr,"Landing");function zr({title:s,onBack:a}){return e.jsxs("div",{className:"mx-library-programs__detail",children:[e.jsx("button",{type:"button",className:"mx-library-programs__back",onClick:a,"aria-label":"Назад",children:e.jsx(R,{size:19})}),e.jsx("div",{className:"mx-library-programs__detail-art","aria-hidden":"true",children:e.jsx(Cs,{})}),e.jsx("h2",{children:s}),e.jsx("p",{className:"mx-library-programs__detail-status",children:"Скоро"})]})}r(zr,"Detail");function $r({articleId:s,onBack:a,onChangeArticle:t,readIds:i,onFinish:n}){const l=Math.max(0,M.findIndex(b=>b.id===s)),[c,d]=o.useState(l),[m,x]=o.useState(()=>{try{return window.sessionStorage.getItem(Ye)!=="seen"}catch{return!0}}),h=o.useRef(null),u=o.useRef({}),p=o.useRef(null),v=r((b,_="smooth")=>{var g,S;return(S=(g=h.current)==null?void 0:g.children[Math.max(0,Math.min(M.length-1,b))])==null?void 0:S.scrollIntoView({behavior:_,block:"nearest",inline:"start"})},"scrollTo");o.useEffect(()=>{if(!m)return;const b=window.setTimeout(()=>x(!1),2600);return()=>window.clearTimeout(b)},[m]);function y(){x(!1);try{window.sessionStorage.setItem(Ye,"seen")}catch{}}r(y,"dismissSwipeHint");function C(b){p.current={x:b.clientX,y:b.clientY}}r(C,"handleRailPointerDown");function A(b){const _=p.current;p.current=null,_&&(Math.abs(b.clientX-_.x)>32||Math.abs(b.clientY-_.y)>32)&&y()}return r(A,"handleRailPointerUp"),e.jsxs("div",{className:"mx-library-programs__reader",children:[e.jsxs("header",{className:"mx-library-programs__reader-header",children:[e.jsx("button",{type:"button",onClick:a,"aria-label":"← Библиотека",children:"← Библиотека"}),e.jsxs("span",{children:[c+1," из ",M.length]}),e.jsx("span",{className:"mx-library-programs__reader-progress",style:{"--reader-progress":`${(c+1)/M.length*100}%`}})]}),e.jsx("div",{className:"mx-library-programs__reader-rail",ref:h,onPointerDown:C,onPointerUp:A,onScroll:r(b=>{const _=b.currentTarget,g=Math.round(_.scrollLeft/_.clientWidth);Math.abs(_.scrollLeft-c*_.clientWidth)<_.clientWidth*.28||g!==c&&M[g]&&(y(),d(g),t(M[g].id))},"onScroll"),children:M.map(b=>e.jsx("div",{className:"mx-library-programs__reader-page",children:e.jsxs("article",{className:"mx-library-programs__reader-slide",onScroll:r(_=>{const g=_.currentTarget;u.current[b.id]=g.scrollTop,!i.has(b.id)&&g.scrollTop+g.clientHeight>=g.scrollHeight-24&&n(b.id)},"onScroll"),"data-article-id":b.id,children:[e.jsx(Ee,{article:b,variant:"banner",className:"mx-library-programs__reader-art"}),e.jsx("span",{className:"mx-library-programs__eyebrow",children:b.eyebrow}),e.jsx("h1",{children:b.title}),e.jsx("small",{children:b.duration}),e.jsx("p",{className:"mx-library-programs__reader-situation",children:b.situation}),e.jsx("p",{className:"mx-library-programs__reader-lead",children:b.intro}),e.jsx("h2",{children:"Одна мысль"}),e.jsx("p",{children:b.thought}),e.jsx("blockquote",{children:b.quote}),e.jsx("h2",{children:"Из жизни"}),e.jsx("p",{children:b.example}),b.blocks.map(([_,g])=>e.jsxs("section",{children:[e.jsx("h2",{children:_}),e.jsx("p",{children:g})]},_)),e.jsxs("section",{className:"mx-library-programs__reader-try",children:[e.jsx("span",{className:"mx-library-programs__eyebrow",children:"Попробуй сегодня"}),e.jsx("p",{children:b.tryToday})]}),e.jsx("p",{className:"mx-library-programs__reader-close",children:b.closing}),i.has(b.id)&&e.jsx("p",{className:"mx-library-programs__reader-read",children:"Прочитано"}),e.jsxs("button",{type:"button",className:"mx-library-programs__reader-next",onClick:r(()=>c<M.length-1?v(c+1):a,"onClick"),children:[e.jsx("span",{children:c<M.length-1?"Следующая статья →":"Вернуться к статьям"}),e.jsx("strong",{children:c<M.length-1?M[c+1].title:"Все статьи"})]})]})},b.id))}),m&&e.jsx("div",{className:"mx-library-programs__reader-hint",role:"status",children:"Смахните влево, чтобы открыть следующую статью"})]})}r($r,"ArticleReader");function Or({saved:s,onBack:a,onOpenTemplate:t}){const i=(s==null?void 0:s.status)==="completed"?"Завершено":s?`Продолжить · ${Math.min(4,s.step+1)} из 4`:"Начать";return e.jsxs("div",{className:"mx-library-programs__guided-catalog",children:[e.jsxs("button",{type:"button",className:"mx-library-programs__back",onClick:a,"aria-label":"Вернуться в библиотеку",children:[e.jsx(R,{size:19})," ",e.jsx("span",{children:"Библиотека"})]}),e.jsx("span",{className:"mx-library-programs__eyebrow",children:"Коллекция"}),e.jsx("h1",{children:"Направленные записи"}),e.jsx("p",{className:"mx-library-programs__guided-intro",children:"Короткие вопросы, чтобы остановиться, увидеть главное и сохранить следующий шаг."}),e.jsxs("button",{type:"button",className:"mx-library-programs__guided-template",onClick:t,children:[e.jsx("span",{className:"mx-library-programs__guided-template-art","aria-hidden":"true",children:e.jsx(w,{kind:"journal",animated:!1})}),e.jsxs("span",{children:[e.jsx("strong",{children:"Прояснить выбор"}),e.jsx("small",{children:"4 вопроса, чтобы принять решение"}),e.jsxs("small",{children:["5–7 минут · ",i]})]})]})]})}r(Or,"GuidedCatalog");function je({onBack:s,step:a,label:t}){return e.jsxs("header",{className:"mx-library-programs__flow-header",children:[e.jsx("button",{type:"button",onClick:s,"aria-label":"Назад",children:e.jsx(R,{size:19})}),e.jsx("span",{children:t}),e.jsx("strong",{children:a})]})}r(je,"FlowHeader");function ss({saved:s,stage:a,stepIndex:t,answers:i,onBack:n,onStart:l,onChange:c,onContinue:d,onReview:m,onSave:x,onReturn:h}){return a==="intro"?e.jsxs("div",{className:"mx-library-programs__guided-flow mx-library-programs__guided-intro-screen",children:[e.jsx(je,{onBack:n,step:"",label:"Направленные записи"}),e.jsxs("div",{className:"mx-library-programs__guided-flow-center",children:[e.jsx("span",{className:"mx-library-programs__guided-flow-art","aria-hidden":"true",children:e.jsx(w,{kind:"journal",animated:!1})}),e.jsx("span",{className:"mx-library-programs__eyebrow",children:"Прояснить выбор"}),e.jsx("h1",{children:"Разложите ситуацию по частям и увидьте следующий шаг"}),e.jsx("p",{children:"4 вопроса · 5–7 минут"}),e.jsx("button",{type:"button",className:"mx-library-programs__primary",onClick:l,children:"Начать"})]})]}):a==="review"?e.jsxs("div",{className:"mx-library-programs__guided-flow mx-library-programs__guided-review",children:[e.jsx(je,{onBack:n,step:"Проверка",label:"Прояснить выбор"}),e.jsx("span",{className:"mx-library-programs__eyebrow",children:"Ваши ответы"}),e.jsx("h1",{children:"Остановитесь на том, что стало яснее"}),e.jsx("div",{className:"mx-library-programs__answer-list",children:$.map((u,p)=>e.jsxs("section",{children:[e.jsxs("small",{children:[p+1," из 4"]}),e.jsx("h2",{children:u}),e.jsx("p",{children:i[p]})]},u))}),e.jsx("button",{type:"button",className:"mx-library-programs__primary",onClick:x,children:"Сохранить запись"})]}):e.jsxs("div",{className:"mx-library-programs__guided-flow mx-library-programs__guided-writing",children:[e.jsx(je,{onBack:n,step:`${t+1} из 4`,label:"Прояснить выбор"}),e.jsxs("span",{className:"mx-library-programs__eyebrow",children:["Вопрос ",t+1]}),e.jsx("h1",{children:$[t]}),e.jsx("p",{className:"mx-library-programs__guided-hint",children:"Ответьте так, как получается сейчас. Правильной формулировки не нужно."}),e.jsx("textarea",{autoFocus:!0,value:i[t],onChange:r(u=>c(u.target.value),"onChange"),placeholder:"Начните писать…","aria-label":$[t]}),e.jsxs("div",{className:"mx-library-programs__guided-actions",children:[e.jsx("button",{type:"button",className:"mx-library-programs__secondary",onClick:n,children:"Назад"}),e.jsx("button",{type:"button",className:"mx-library-programs__primary",disabled:!i[t].trim(),onClick:t===3?m:d,children:t===3?"Проверить ответы":"Продолжить"})]})]})}r(ss,"GuidedJournal");function Br({onReturn:s}){return e.jsxs("div",{className:"mx-library-programs__guided-flow mx-library-programs__guided-completion",children:[e.jsx("span",{className:"mx-library-programs__guided-completion-mark","aria-hidden":"true",children:"✓"}),e.jsx("span",{className:"mx-library-programs__eyebrow",children:"Прояснить выбор"}),e.jsx("h1",{children:"Запись сохранена"}),e.jsx("p",{children:"Ответы остались в этом preview-сеансе. К ним можно вернуться из каталога."}),e.jsx("button",{type:"button",className:"mx-library-programs__primary",onClick:s,children:"Вернуться в библиотеку"})]})}r(Br,"Completion");function Hr(){var Ie,Te;const s=es(),a=s.get("screen")||"landing",[t,i]=o.useState(a),[n,l]=o.useState(s.get("stage")||"intro"),[c,d]=o.useState(Math.max(0,Math.min(3,Number(s.get("step"))||0))),[m,x]=o.useState(()=>{try{return new Set(JSON.parse(window.sessionStorage.getItem("mentalix-library-read")||"[]"))}catch{return new Set}}),[h,u]=o.useState(Qe),[p,v]=o.useState(()=>{var j;return((j=Qe())==null?void 0:j.answers)||Sr()}),[y,C]=o.useState(s.get("article")||M[0].id),[A,b]=o.useState(s.get("program")||"Самодисциплина"),_=s.get("review")==="1";o.useEffect(()=>{window.sessionStorage.setItem("mentalix-library-read",JSON.stringify([...m]))},[m]),o.useEffect(()=>{window.requestAnimationFrame(()=>{var j;(j=document.querySelector(".mx-library-programs__scroll"))==null||j.scrollTo({top:0,behavior:"auto"})})},[t]),o.useEffect(()=>{const j=r(()=>{const N=es();i(N.get("screen")||"landing"),l(N.get("stage")||"intro"),d(Math.max(0,Math.min(3,Number(N.get("step"))||0))),C(N.get("article")||M[0].id),b(N.get("program")||"Самодисциплина")},"handlePopState");return window.addEventListener("popstate",j),()=>window.removeEventListener("popstate",j)},[]);function g(j,N={},ne=!1){const De=Er(j,N);ne?window.history.replaceState({mentalixLibrary:!0},"",De):window.history.pushState({mentalixLibrary:!0},"",De),i(j),N.stage&&l(N.stage),N.step!==void 0&&d(Number(N.step)),N.article&&C(N.article),N.program&&b(N.program)}r(g,"navigate");function S(j="landing"){var N;(N=window.history.state)!=null&&N.mentalixLibrary?window.history.back():g(j,{},!0)}r(S,"back");function V(){const j=(h==null?void 0:h.status)==="completed"?"review":h?"writing":"intro";j==="review"?g("review",{template:z}):g("journal",{template:z,stage:j,step:(h==null?void 0:h.step)||0})}r(V,"openJournal");function se(j){const N=[...p];N[c]=j,v(N),q(N,c),u({answers:N,step:c,status:"draft"})}r(se,"updateAnswer");function ae(){const j=p.findIndex(ne=>!ne.trim()),N=j===-1?3:j;d(N),g("journal",{template:z,stage:"writing",step:N})}r(ae,"startJournal");function te(){const j=Math.min(3,c+1);q(p,j),u({answers:p,step:j,status:"draft"}),d(j),g("journal",{template:z,stage:"writing",step:j})}r(te,"continueJournal");function re(){q(p,3),u({answers:p,step:3,status:"draft"}),g("review",{template:z})}r(re,"reviewJournal");function ie(){q(p,3,"completed"),u({answers:p,step:3,status:"completed"}),g("completion",{template:z})}r(ie,"saveJournal");function k(){g("landing",{},!0)}r(k,"returnToLibrary");function P(j){x(N=>N.has(j)?N:new Set(N).add(j))}r(P,"finishArticle");const D=!!(typeof window<"u"&&((Te=(Ie=window.Telegram)==null?void 0:Ie.WebApp)!=null&&Te.initData));Us(()=>S(),D&&t!=="landing");let I;t==="detail"?I=e.jsx(zr,{title:A,onBack:r(()=>S(),"onBack")}):t==="articles"?I=e.jsx(Rr,{onBack:r(()=>S(),"onBack"),onRead:r(j=>{C(j),g("article",{article:j})},"onRead")}):t==="article"?I=e.jsx($r,{articleId:y,onBack:r(()=>S(),"onBack"),readIds:m,onFinish:P,onChangeArticle:r(j=>{C(j),g("article",{article:j},!0)},"onChangeArticle")}):t==="catalog"?I=e.jsx(Or,{saved:h,onBack:r(()=>g("landing",{},!0),"onBack"),onOpenTemplate:V}):t==="journal"?I=e.jsx(ss,{saved:h,stage:n,stepIndex:c,answers:p,onBack:r(()=>n==="writing"?c>0?g("journal",{template:z,stage:"writing",step:c-1},!0):g("catalog",{},!0):S("catalog"),"onBack"),onStart:ae,onChange:se,onContinue:te,onReview:re}):t==="review"?I=e.jsx(ss,{saved:h,stage:"review",stepIndex:3,answers:p,onBack:r(()=>S("journal"),"onBack"),onSave:ie}):t==="completion"?I=e.jsx(Br,{onReturn:k}):I=e.jsx(Dr,{onOpenArticles:r(()=>g("articles"),"onOpenArticles"),onOpenDetail:r(j=>{b(j),g("detail",{program:j})},"onOpenDetail"),onOpenJournals:r(()=>g("catalog"),"onOpenJournals")});const ks=["journal","review","completion"].includes(t);return e.jsxs("section",{className:`mx-library-programs${_?" mx-library-programs--review":""}${D?" mx-library-programs--telegram":""}`,"aria-labelledby":"library-programs-title",children:[!_&&e.jsxs("div",{className:"mx-library-programs__intro",children:[e.jsx("span",{className:"mx-library-programs__eyebrow",children:"MXL-LIBRARY-PROGRAMS-UI-LAB-001 · Preview-only"}),e.jsx("h2",{id:"library-programs-title",children:"Библиотека: программы"}),e.jsx("p",{children:"Канонический mobile-концепт. Состояние направленных записей сохраняется только в preview-сеансе."})]}),e.jsxs("div",{className:"mx-library-programs__device",children:[_?null:e.jsx(Mr,{}),e.jsx("div",{className:"mx-library-programs__scroll",children:I}),!ks&&t!=="article"&&e.jsx(Tr,{})]})]})}r(Hr,"LibraryProgramsExperiment");const Ur=[{key:"confirmed",label:"Подтверждено"},{key:"ambiguous",label:"Неоднозначно"},{key:"empty",label:"Мало данных"},{key:"loading",label:"Загрузка"},{key:"error",label:"Ошибка"}],as={text:"В дни с завершённым вечерним разбором настроение было выше.",sampleSize:12,sourceDates:["2026-09-02","2026-09-04","2026-09-06","2026-09-08"],caveat:"Это описание доступных отметок, а не доказательство причины и не прогноз."};function Fr(s){return new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short"}).format(new Date(`${s}T00:00:00`))}r(Fr,"formatDate");function Gr({observation:s}){return e.jsxs("div",{className:"mx-progress-observation__evidence",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Выборка"}),e.jsxs("strong",{children:[s.sampleSize," отметок"]})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Период"}),e.jsxs("strong",{children:[s.sourceDates.length," дат"]})]}),e.jsxs("details",{children:[e.jsx("summary",{children:"Даты в основе"}),e.jsx("p",{children:s.sourceDates.map(Fr).join(" · ")})]})]})}r(Gr,"Evidence");function Vr({state:s,onCta:a}){if(s==="loading")return e.jsxs("div",{className:"mx-progress-observation__card",role:"status","aria-label":"Загрузка наблюдения",children:[e.jsx("span",{className:"mx-progress-observation__label",children:"Главное наблюдение"}),e.jsx("div",{className:"mx-progress-observation__skeleton"}),e.jsx("div",{className:"mx-progress-observation__skeleton mx-progress-observation__skeleton--short"}),e.jsx("p",{className:"mx-progress-observation__muted",children:"Собираем данные за выбранный период…"})]});if(s==="error")return e.jsxs("div",{className:"mx-progress-observation__card",role:"alert",children:[e.jsx("span",{className:"mx-progress-observation__label",children:"Наблюдение недоступно"}),e.jsx("h3",{children:"Не удалось загрузить данные"}),e.jsx("p",{className:"mx-progress-observation__muted",children:"Попробуй обновить экран. Содержимое не заменяется догадкой."}),e.jsx("button",{type:"button",className:"mx-progress-observation__secondary",onClick:a,children:"Повторить попытку"})]});if(s==="empty")return e.jsxs("div",{className:"mx-progress-observation__card",role:"status",children:[e.jsx("span",{className:"mx-progress-observation__label",children:"Главное наблюдение"}),e.jsx("h3",{children:"Пока недостаточно данных"}),e.jsx("p",{className:"mx-progress-observation__muted",children:"Нужно ещё несколько отметок, чтобы сравнение было честным. Наблюдение не появляется из одного дня."})]});const t=s==="ambiguous",i=t?{...as,text:"Есть различие между группами дней, но пока неясно, что его объясняет.",caveat:"Данных недостаточно для безопасного следующего шага; причинный вывод не делаем."}:as;return e.jsxs("div",{className:"mx-progress-observation__card","data-primary-observation":"true",children:[e.jsx("span",{className:"mx-progress-observation__label",children:"Главное наблюдение"}),e.jsx("h3",{children:i.text}),e.jsx(Gr,{observation:i}),e.jsx("p",{className:"mx-progress-observation__caveat",children:i.caveat}),e.jsxs("div",{className:"mx-progress-observation__action",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Следующий шаг"}),e.jsx("p",{children:t?"Сначала собери ещё отметки — действие не назначается автоматически.":"Разбор помогает проверить наблюдение на своём опыте."})]}),e.jsx("button",{type:"button",className:"mx-progress-observation__primary",disabled:t,onClick:a,children:t?"Пока недоступно":"Открыть разбор"})]})]})}r(Vr,"ObservationCard");function Zr(){const[s,a]=o.useState("confirmed"),[t,i]=o.useState("");function n(){i(s==="error"?"В Preview повторный запрос имитируется; production-переход не подключён.":"CTA показана как candidate; production-переход не подключён.")}return r(n,"handleAction"),e.jsxs("section",{className:"mx-progress-observation","aria-labelledby":"progress-observation-title","data-experiment-id":"MXL-PROGRESS-UX-002",children:[e.jsxs("div",{className:"mx-progress-observation__intro",children:[e.jsx("span",{children:"UI Lab · MXL-PROGRESS-UX-002"}),e.jsx("h2",{id:"progress-observation-title",children:"Наблюдение + следующий шаг"}),e.jsx("p",{children:"Альтернативный candidate для экрана «Прогресс». Одна описательная карточка показывает evidence и предлагает действие только при однозначном состоянии. Production не подключён."})]}),e.jsx("div",{className:"mx-progress-observation__states","aria-label":"Состояния candidate",children:Ur.map(l=>e.jsx("button",{type:"button","aria-pressed":s===l.key,onClick:r(()=>{a(l.key),i("")},"onClick"),children:l.label},l.key))}),e.jsx(Vr,{state:s,onCta:n}),e.jsx("p",{className:"mx-progress-observation__feedback",role:"status","aria-live":"polite",children:t})]})}r(Zr,"ProgressObservationExperiment");const Xr=[["ready","Есть данные"],["insufficient","Мало данных"],["empty","Пусто"],["loading","Загрузка"],["error","Ошибка"]],Wr=[7,14,30,90],ts=[3.1,3.4,3.2,3.8,4.1,3.7,3.9,3.5,3.2,2.8,3.1,2.7,2.5,2.9,3.3,3.1,3.6,3.9,3.7,4.2,4.1,4.4,4,4.3,4.5,4.2,4.6,4.4,4.7,4.5],rs=[{label:"Главное наблюдение",title:"К концу периода настроение стало устойчивее.",note:"Основа: 24 отметки · 18 дат"},{label:"Ритм недели",title:"После вечернего разбора утро чаще начиналось спокойнее.",note:"Описание совпадений, а не доказательство причины"},{label:"Следующий шаг",title:"Сохрани короткий вечерний разбор ещё на три дня.",note:"Небольшая проверка наблюдения на своём опыте"}],qr=[["спокойно",8,"high"],["собранно",6,"high"],["задумчиво",5,"middle"],["устал",3,"low"]],Kr=[["Ритуалы","82%","выполнено",82],["Аскезы","76%","удержано",76],["Энергия","3.8","среднее из 5",68],["Фокус","4.1","среднее из 5",78]];function Jr(s,a=312,t=126){return s.length<2?"":s.map((i,n)=>{const l=n/(s.length-1)*a,c=t-(i-1)/4*t;return`${n===0?"M":"L"} ${l.toFixed(1)} ${c.toFixed(1)}`}).join(" ")}r(Jr,"pathFor");function Yr(){const s=[["Сегодня",ms],["Практики",xs],["Диалог",hs],["Библиотека",ps],["Прогресс",us]];return e.jsx("nav",{className:"mx-progress-redesign__bottom-nav","aria-label":"Демо основной навигации",children:s.map(([a,t])=>e.jsxs("span",{"data-active":a==="Прогресс"?"true":void 0,children:[e.jsx(t,{size:18,strokeWidth:1.7}),e.jsx("small",{children:a})]},a))})}r(Yr,"BottomNavigation");function Qr({activePeriod:s,onChange:a}){return e.jsx("div",{className:"mx-progress-redesign__periods","aria-label":"Период аналитики",children:Wr.map(t=>e.jsxs("button",{type:"button","aria-pressed":t===s,onClick:r(()=>a(t),"onClick"),children:[t," дней"]},t))})}r(Qr,"PeriodSelector");function ei({state:s,period:a}){const t=s==="insufficient"?ts.slice(0,4):ts,i=Jr(t),n=s==="ready"||s==="insufficient";return e.jsxs("section",{className:"mx-progress-redesign__hero","aria-labelledby":"progress-hero-title",children:[e.jsxs("div",{className:"mx-progress-redesign__hero-copy",children:[e.jsx("span",{children:"Среднее настроение"}),e.jsxs("div",{children:[e.jsx("strong",{children:s==="ready"?"4.1":s==="insufficient"?"3.4":"—"}),e.jsx("small",{children:"из 5"})]}),e.jsx("p",{id:"progress-hero-title",children:s==="ready"?"Во второй половине периода настроение чаще было выше.":s==="insufficient"?"Первые точки уже есть. Ещё несколько дней — и линия станет честнее.":"Здесь появится общая картина выбранного периода."})]}),e.jsx("div",{className:"mx-progress-redesign__chart","data-state":s,children:s==="loading"?e.jsx("div",{className:"mx-progress-redesign__chart-skeleton","aria-label":"Загрузка графика"}):s==="error"?e.jsxs("div",{className:"mx-progress-redesign__chart-message",role:"alert",children:[e.jsx("strong",{children:"График не загрузился"}),e.jsx("span",{children:"Сохранённые отметки не изменились."}),e.jsx("button",{type:"button",children:"Повторить"})]}):n?e.jsxs(e.Fragment,{children:[e.jsxs("svg",{viewBox:"0 0 312 126",preserveAspectRatio:"none","aria-hidden":"true",children:[e.jsx("path",{className:"mx-progress-redesign__chart-grid",d:"M 0 31.5 H 312 M 0 63 H 312 M 0 94.5 H 312"}),e.jsx("path",{className:"mx-progress-redesign__chart-line",d:i}),t.map((l,c)=>{const d=c/Math.max(t.length-1,1)*312,m=126-(l-1)/4*126;return e.jsx("circle",{cx:d,cy:m,r:"2.2"},`${c}-${l}`)})]}),e.jsxs("div",{className:"mx-progress-redesign__chart-axis","aria-hidden":"true",children:[e.jsx("span",{children:"1"}),e.jsx("span",{children:Math.round(a/2)}),e.jsx("span",{children:a})]})]}):e.jsxs("div",{className:"mx-progress-redesign__chart-message",children:[e.jsx("strong",{children:"Пока нет точек"}),e.jsx("span",{children:"Отметь настроение — график начнёт собираться день за днём."})]})})]})}r(ei,"HeroChart");function si({state:s}){const a=s==="ready"?rs:rs.slice(0,1);return e.jsxs("section",{className:"mx-progress-redesign__section","aria-labelledby":"progress-observations-title",children:[e.jsxs("div",{className:"mx-progress-redesign__section-head",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Что можно заметить"}),e.jsx("h3",{id:"progress-observations-title",children:"Наблюдения"})]}),e.jsx("small",{children:s==="ready"?"1 / 3":"1 / 1"})]}),e.jsx("div",{className:"mx-progress-redesign__rail",children:a.map(t=>e.jsxs("article",{className:"mx-progress-redesign__observation",children:[e.jsx("span",{children:t.label}),e.jsx("strong",{children:s==="ready"?t.title:"Пока недостаточно данных для устойчивого наблюдения."}),e.jsx("p",{children:s==="ready"?t.note:"Продолжай отмечать состояние — вывод не будет придуман из одной точки."})]},t.label))}),e.jsx("p",{className:"mx-progress-redesign__caveat",children:"Это описания доступных отметок, а не диагноз, прогноз или доказательство причины."})]})}r(si,"ObservationRail");function ai({state:s}){const a=s==="ready";return e.jsxs("section",{className:"mx-progress-redesign__section","aria-labelledby":"progress-calendar-title",children:[e.jsxs("div",{className:"mx-progress-redesign__section-head",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Одна точка — один день"}),e.jsx("h3",{id:"progress-calendar-title",children:"Календарь состояния"})]}),e.jsxs("div",{className:"mx-progress-redesign__month-nav","aria-label":"Месяц",children:[e.jsx("button",{type:"button","aria-label":"Предыдущий месяц",children:e.jsx(Js,{size:16})}),e.jsx("small",{children:"Сентябрь"}),e.jsx("button",{type:"button","aria-label":"Следующий месяц",children:e.jsx(ds,{size:16})})]})]}),e.jsxs("div",{className:"mx-progress-redesign__calendar-card",children:[e.jsx("div",{className:"mx-progress-redesign__weekdays","aria-hidden":"true",children:["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(t=>e.jsx("span",{children:t},t))}),e.jsx("div",{className:"mx-progress-redesign__calendar","aria-label":"Отметки состояния за месяц",children:Array.from({length:35},(t,i)=>e.jsx("i",{"data-filled":a&&![0,6,12,19,27,31].includes(i)?"true":void 0,"data-tone":i%4+1},i))}),!a&&e.jsx("p",{children:"Календарь заполнится после ежедневных чек-инов."})]})]})}r(ai,"Calendar");function ti({state:s}){return e.jsxs("section",{className:"mx-progress-redesign__section","aria-labelledby":"progress-emotions-title",children:[e.jsx("div",{className:"mx-progress-redesign__section-head",children:e.jsxs("div",{children:[e.jsx("span",{children:"Слова из чек-ина"}),e.jsx("h3",{id:"progress-emotions-title",children:"Эмоции"})]})}),e.jsxs("div",{className:"mx-progress-redesign__emotion-card",children:[e.jsxs("div",{className:"mx-progress-redesign__emotion-ring","aria-hidden":"true",children:[e.jsx("span",{children:"22"}),e.jsx("small",{children:"отметки"})]}),e.jsx("div",{className:"mx-progress-redesign__emotion-list",children:(s==="ready"?qr:[["пока нет данных",0,"middle"]]).map(([a,t,i])=>e.jsxs("div",{"data-tone":i,children:[e.jsx("i",{}),e.jsx("span",{children:a}),e.jsx("small",{children:t||"—"})]},a))})]})]})}r(ti,"Emotions");function ri({state:s}){return e.jsxs("section",{className:"mx-progress-redesign__section","aria-labelledby":"progress-activities-title",children:[e.jsxs("div",{className:"mx-progress-redesign__section-head",children:[e.jsxs("div",{children:[e.jsx("span",{children:"По существующим данным"}),e.jsx("h3",{id:"progress-activities-title",children:"Активности"})]}),e.jsx("small",{children:"4"})]}),e.jsx("div",{className:"mx-progress-redesign__activities",children:Kr.map(([a,t,i,n])=>e.jsxs("article",{children:[e.jsx("span",{children:a}),e.jsx("strong",{children:s==="ready"?t:"—"}),e.jsx("small",{children:s==="ready"?i:"данные ещё собираются"}),e.jsx("i",{children:e.jsx("b",{style:{width:s==="ready"?`${n}%`:"4%"}})})]},a))})]})}r(ri,"Activities");function ii({state:s,activePeriod:a,setActivePeriod:t}){return e.jsxs(e.Fragment,{children:[e.jsxs("header",{className:"mx-progress-redesign__header",children:[e.jsx("h2",{children:"прогресс."}),e.jsxs("span",{children:[a," дней"]})]}),e.jsx(Qr,{activePeriod:a,onChange:t}),e.jsx(ei,{state:s,period:a}),s!=="loading"&&s!=="error"&&e.jsxs(e.Fragment,{children:[e.jsx(si,{state:s}),e.jsx(ai,{state:s}),e.jsx(ti,{state:s}),e.jsx(ri,{state:s})]})]})}r(ii,"ProgressScreen");function ni(){const[s,a]=o.useState("ready"),[t,i]=o.useState(30),n=o.useMemo(()=>`${s}-${t}`,[s,t]);return e.jsxs("section",{className:"mx-progress-redesign","data-experiment-id":"MXL-PROGRESS-REDESIGN-001",children:[e.jsxs("div",{className:"mx-progress-redesign__intro",children:[e.jsx("span",{children:"UI Lab · Preview-only"}),e.jsx("h2",{children:"Полный редизайн «Прогресса»"}),e.jsx("p",{children:"Композиция Stoic переведена в визуальный язык Mentalix. Здесь только fixtures; production, API, вычисления и навигация не изменены."})]}),e.jsx("div",{className:"mx-progress-redesign__states","aria-label":"Состояние демо",children:Xr.map(([l,c])=>e.jsx("button",{type:"button","aria-pressed":s===l,onClick:r(()=>a(l),"onClick"),children:c},l))}),e.jsxs("div",{className:"mx-progress-redesign__device",children:[e.jsxs("div",{className:"mx-progress-redesign__top-safe","aria-hidden":"true",children:[e.jsx("span",{children:"MENTALIX"}),e.jsx("i",{})]}),e.jsx("div",{className:"mx-progress-redesign__scroll",children:e.jsx(ii,{state:s,activePeriod:t,setActivePeriod:i})},n),e.jsx(Yr,{})]})]})}r(ni,"ProgressRedesignExperiment");const U=[{key:"mayak",name:"Собеседник",promise:"поможет услышать",question:`Что сейчас
у тебя на душе?`,description:"Тёплый и внимательный. Поможет разобраться в чувствах, когда непросто.",starters:["Мне нужно выговориться","Помоги назвать, что я чувствую"]},{key:"kompas",name:"Наставник",promise:"поможет выбрать следующий шаг",question:`Какой шаг
ты сделаешь сегодня?`,description:"Покажет один небольшой шаг, который можно попробовать сегодня и отменить без стыда.",starters:["Я топчусь на месте…","Помоги начать с малого"]},{key:"dnevnik",name:"Следопыт",promise:"поможет заметить паттерн",question:`Что сегодня
осталось с тобой?`,description:"Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.",starters:["Что я сегодня упускаю?","Помоги подвести итог дня"]}],li=[{id:"hybrid",label:"Рекомендованный гибрид · направления 1 + 2",title:"Один следующий обратимый шаг",summary:"Проверяемое обещание роли и одно действие, которое можно попробовать сегодня и отменить без стыда.",cta:"Попробовать шаг",helper:"Можно передумать или закрыть разговор без продолжения."},{id:"starter",label:"Контроль · направление 3",title:"Мягкое знакомство через starter-сценарий",summary:"Начните с одного короткого сценария: можно ответить одной фразой или пропустить.",cta:"Начать сценарий",helper:"После первого обмена можно выбрать: продолжить или выбрать другую роль."}];function ci({persona:s,variant:a,active:t,onAction:i}){const n=s.question.split(`
`);return e.jsxs("article",{className:"mx-persona-redesign__card","aria-label":`${s.name}: ${s.promise}`,children:[e.jsx("div",{className:"mx-persona-redesign__art","aria-hidden":"true",children:e.jsx(w,{kind:Fs(s.key),animated:t,highlighted:t,className:"mx-persona-redesign__glyph"})}),e.jsxs("div",{className:"mx-persona-redesign__content",children:[e.jsxs("div",{className:"mx-persona-redesign__identity",children:[e.jsx("h4",{children:s.name}),e.jsx("span",{children:s.promise}),e.jsxs("p",{children:[n[0],e.jsx("br",{}),n[1]]})]}),e.jsx("p",{className:"mx-persona-redesign__description",children:s.description}),e.jsxs("div",{className:"mx-persona-redesign__actions",children:[e.jsx("div",{className:"mx-persona-redesign__starters","aria-label":"Стартовые варианты",children:s.starters.map(l=>e.jsx("button",{type:"button",onClick:r(()=>i(`${s.name}: ${l}`),"onClick"),children:l},l))}),e.jsx("button",{type:"button",className:"mx-persona-redesign__cta",onClick:r(()=>i(`${s.name}: ${a.cta}`),"onClick"),children:a.cta}),e.jsx("p",{className:"mx-persona-redesign__helper",children:a.helper})]})]})]})}r(ci,"PersonaCard");function oi({variant:s,onAction:a,feedback:t}){const[i,n]=o.useState(0),l=o.useRef(null);function c(){const m=l.current,x=m==null?void 0:m.firstElementChild;!m||!x||n(Math.max(0,Math.min(U.length-1,Math.round(m.scrollLeft/(x.offsetWidth+12)))))}r(c,"syncActive");function d(m){const x=l.current,h=x==null?void 0:x.firstElementChild;!x||!h||(x.scrollTo({left:m*(h.offsetWidth+12),behavior:"smooth"}),n(m))}return r(d,"selectPage"),e.jsxs("section",{className:"mx-persona-redesign__variant","aria-labelledby":`${s.id}-title`,children:[e.jsxs("header",{className:"mx-persona-redesign__variant-header",children:[e.jsx("span",{children:s.label}),e.jsx("h3",{id:`${s.id}-title`,children:s.title}),e.jsx("p",{children:s.summary})]}),e.jsx("div",{ref:l,className:"mx-persona-redesign__track",onScroll:c,"aria-label":`${s.title}: три персоны`,children:U.map((m,x)=>e.jsx(ci,{persona:m,variant:s,active:i===x,onAction:a},m.key))}),e.jsx("div",{className:"mx-persona-redesign__pagination",role:"group","aria-label":`${s.title}: страница персоны`,children:U.map((m,x)=>e.jsx("button",{type:"button","aria-label":`${m.name}, страница ${x+1} из ${U.length}`,"aria-current":i===x?"page":void 0,onClick:r(()=>d(x),"onClick"),children:e.jsx("span",{"aria-hidden":"true"})},m.key))}),e.jsxs("p",{className:"mx-persona-redesign__active-person",children:["Сейчас: ",U[i].name,". Можно передумать."]}),t&&e.jsx("p",{className:"mx-persona-redesign__feedback",role:"status","aria-live":"polite",children:t})]})}r(oi,"VariantPreview");function di(){const[s,a]=o.useState("");function t(i){a(`Session-local выбор: ${i}`)}return r(t,"handleAction"),e.jsxs("section",{className:"mx-persona-redesign","data-experiment-id":"MXL-435-UI-LAB-001","aria-labelledby":"persona-redesign-title",children:[e.jsxs("header",{className:"mx-persona-redesign__intro",children:[e.jsx("span",{children:"UI Lab · Preview-only · MXL-435-UI-LAB-001"}),e.jsx("h2",{id:"persona-redesign-title",children:"Пикер персон: два первых знакомства"}),e.jsx("p",{children:"Сравнение двух статических вариантов для трёх существующих персон. Production не изменён; выбор хранится только в состоянии этого Preview."})]}),e.jsx("div",{className:"mx-persona-redesign__variants",children:li.map(i=>e.jsx(oi,{variant:i,feedback:s,onAction:t},i.id))}),e.jsx("p",{className:"mx-persona-redesign__note",children:"Общая механика: нативный snap-скролл, верхняя SemanticGlyph-зона, один dot-пагинатор на вариант и touch-friendly controls."})]})}r(di,"PersonaPickerRedesignExperiment");const mi={1:"experiments",showcase:"baseline"};function xi(s="hub"){return mi[s]||(["baseline","hub","experiments","compare","daily-canonical","practice-catalog","library","library-programs","progress-observation","progress-redesign","mentor-picker"].includes(s)?s:"hub")}r(xi,"resolveUiLabSection");function Di({initialSection:s="hub"}){const[a]=o.useState(xi(s)),[t,i]=o.useState("checkinPending"),n=a==="library-programs"&&new URLSearchParams(window.location.search).get("review")==="1";return e.jsx("main",{className:"mx-ui-lab",children:e.jsxs("div",{className:"mx-ui-lab__scroll",children:[!n&&e.jsxs("header",{className:"mx-ui-lab__header",children:[e.jsx("p",{className:"mx-ui-lab__kicker",children:"Mentalix · Preview-only"}),e.jsx("h1",{children:"Эталон → Эксперименты → Сравнение"}),e.jsx("p",{children:"Здесь можно посмотреть актуальный интерфейс, гипотезы и разницу между ними. Production не изменён."}),e.jsx(_s,{active:a})]}),e.jsxs("div",{className:"mx-ui-lab__content",children:[a==="hub"&&e.jsx(ur,{}),a==="baseline"&&e.jsxs(e.Fragment,{children:[e.jsx(xe,{mode:"baseline",selectedState:t,onStateChange:i}),e.jsxs("section",{className:"mx-practice-comparison","aria-labelledby":"practice-comparison-title",children:[e.jsxs("div",{className:"mx-practice-comparison__intro",children:[e.jsx("span",{children:"UI-EXP-003 · сравнение каталога"}),e.jsx("h2",{id:"practice-comparison-title",children:"Практики: сейчас и «Ярусный каталог»"}),e.jsx("p",{children:"Слева — текущий production baseline, справа — Preview-only прототип с live-источниками. Production Practices.jsx пока не изменён."})]}),e.jsxs("div",{className:"mx-practice-comparison__grid",children:[e.jsx(Oe,{}),e.jsx(Ge,{mode:"after"})]})]})]}),a==="experiments"&&e.jsxs(e.Fragment,{children:[e.jsx(xe,{mode:"experiments",selectedState:t,onStateChange:i}),e.jsxs("section",{className:"mx-ui-lab__catalog","aria-labelledby":"catalog-title",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Каталог гипотез"}),e.jsx("h2",{id:"catalog-title",children:"Эксперименты по областям"}),e.jsx("p",{children:"Выберите прототип для просмотра. Устаревшие поверхности сохранены как кандидаты на архив, а не удалены молча."})]}),e.jsx("div",{className:"mx-ui-lab__groups",children:["Сегодня","Чек-ин и завершение","Практики","Путь и серии","Motion и карточки","Системные элементы"].map((l,c)=>e.jsxs("div",{className:"mx-ui-lab__group",children:[e.jsx("strong",{children:l}),e.jsx("span",{children:c===0?"Today · 4 состояния":c===5?"кандидаты на архив отмечены в каталоге":"Preview-only гипотезы"})]},l))})]}),e.jsx(at,{}),e.jsx(vs,{}),e.jsx(Ga,{embedded:!0}),e.jsx(tr,{})]}),a==="compare"&&e.jsx(xe,{mode:"compare",selectedState:t,onStateChange:i}),a==="daily-canonical"&&e.jsx(Dt,{}),a==="practice-catalog"&&e.jsxs("section",{className:"mx-practice-comparison","aria-labelledby":"practice-comparison-route-title",children:[e.jsxs("div",{className:"mx-practice-comparison__intro",children:[e.jsx("span",{children:"UI-EXP-003 · отдельный маршрут manual-gate"}),e.jsx("h2",{id:"practice-comparison-route-title",children:"Практики: production и «Ярусный каталог»"}),e.jsx("p",{children:"Слева — текущий production baseline, справа — Preview-only прототип с live-источниками для ручной проверки на реальном Telegram/iPhone."})]}),e.jsxs("div",{className:"mx-practice-comparison__grid",children:[e.jsx(Oe,{}),e.jsx(Ge,{mode:"after"})]})]}),a==="library"&&e.jsx(Cr,{}),a==="library-programs"&&e.jsx(Hr,{}),a==="progress-observation"&&e.jsx(Zr,{}),a==="progress-redesign"&&e.jsx(ni,{}),a==="mentor-picker"&&e.jsx(di,{})]}),!n&&e.jsx("footer",{className:"mx-ui-lab__footer",children:"Preview-only · live sources подключаются в Telegram-сессии; production Practices.jsx не изменён"})]})})}r(Di,"UiLab");export{Di as default,xi as resolveUiLabSection};
//# sourceMappingURL=UiLab-DNwRjrsN.js.map
