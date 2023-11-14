    function f( the_year, the_month, the_day, the_hour, the_min ) {
        
        
        const the_date = new Date( Date.UTC( the_year,
                                        the_month - 1,
                                        the_day,
                                        the_hour,
                                        the_min,
                                        0 ) );


        const the_DT = the_date.getTime();

        return the_DT;
    }


    function getDate(ms) {
        const date = new Date(ms);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';
      
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
      
        console.log(`${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`);
      }