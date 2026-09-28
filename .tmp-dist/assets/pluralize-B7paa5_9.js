var a=Object.defineProperty;var e=(n,t)=>a(n,"name",{value:t,configurable:!0});function c(n,t){const o=Math.abs(Number(n)||0),r=o%10,u=o%100;return r===1&&u!==11?t[0]:r>=2&&r<=4&&(u<10||u>=20)?t[1]:t[2]}e(c,"pluralize");function f(n,t){return`${n} ${c(n,t)}`}e(f,"formatCount");export{f,c as p};
//# sourceMappingURL=pluralize-B7paa5_9.js.map
