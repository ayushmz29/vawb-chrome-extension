<script>
  export let size;
  export let icon;
  export let color;
  let clazz;
  export { clazz as class };
</script>

<style>
  .mdi-icon {
    /* margin: auto; */
    vertical-align: middle;
  }
</style>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  class="mdi-icon {clazz}"
  fill={color}
  viewBox="0 0 24 24">
  <path d={icon} />
</svg>
