module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    typescript: {
      base: {
        src: ['src/*.ts'],
        dest: 'build/noa.js',
        options: {
          module: 'commonjs', //or commonjs
          target: 'es3', //or es3
          base_path: '.',
          sourcemap: false,
          declaration: true 
        }
      }
    },

    nodeunit: {
      all: ['test/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Default task(s).
  grunt.registerTask('default', ['typescript']);
  grunt.registerTask('test',['nodeunit'])
};