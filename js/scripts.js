mapboxgl.accessToken = 'pk.eyJ1IjoieW9vdXplZSIsImEiOiJjbGc1cWoweWkwNjAwM2Vwbzc1cGVyNmxsIn0.dgHHzAHSakJWLbVW4jFoHQ';

const map = new mapboxgl.Map({
    container: "map", // container ID
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: "mapbox://styles/mapbox/streets-v12", // style URL
    center: [-96.6, 37.75], // starting position [lng, lat]
    zoom: 3.75, // starting zoom
    minZoom: 3.75, // set min zoom
    maxZoom: 5.8 // set max zoom
});
map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {

    // import our election data that we converted to wgs84 in QGIS
    map.addSource('election-county', {
        type: 'geojson',
        data: './data/county_level_presidential_results.geojson',
        generateId: true
    })

    map.addLayer({
        id: 'fill-election-county',
        type: 'fill',
        source: 'election-county',
        paint: {
            'fill-color': [
                'case',
                ['<=', ['get', 'Final_2004_D_votepct'], 0.20], '#accbff', // lightest blue
                ['<=', ['get', 'Final_2004_D_votepct'], 0.40], '#92bbff', // light blue
                ['<=', ['get', 'Final_2004_D_votepct'], 0.60], '#78aaff', // medium blue
                ['<=', ['get', 'Final_2004_D_votepct'], 0.80], '#649eff', // dark blue
                '#4188ff' // darkest blue
            ],
            'fill-opacity': 0.7
        }
    });


    function updateMap(year) {
        map.setPaintProperty('fill-election-county', 'fill-color', [
            'case',
            ['has', `Final_${year}_D_votepct`],
            ['case',
                ['<=', ['get', `Final_${year}_D_votepct`], 0.20], '#accbff', // lightest blue
                ['<=', ['get', `Final_${year}_D_votepct`], 0.40], '#92bbff', // light blue
                ['<=', ['get', `Final_${year}_D_votepct`], 0.60], '#78aaff', // medium blue
                ['<=', ['get', `Final_${year}_D_votepct`], 0.80], '#649eff', // dark blue
                '#4188ff', // darkest blue
            ],
            '#cccccc' // default color
        ]);
    }

    updateMap(2004)

    map.addLayer({
        id: 'county-outline',
        type: 'line',
        source: 'election-county',
        paint: {
            'line-color': '#000000',
            'line-opacity': 0.2,
            'line-width': 1
        }
    });

    map.on('click', 'fill-election-county', (e) => {
        console.log('foo', e.features)


        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.NAMELSAD)
            .addTo(map);
    });


    // add event listeners to the year buttons
    //    const yearButtons = document.querySelectorAll('#sidebar button')
    //    yearButtons.forEach(button => {
    //        button.addEventListener('click', (e) => {
    //            const year = e.target.id.split('-')[1]
    //            updateMap(year)
    //        })
    //    })

    // add event listeners to the year buttons
    const yearButtons = document.querySelectorAll('#sidebar button')

    yearButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // get the year from the button ID
            const year = e.target.id.split('-')[1]

            // remove the 'active' class from all year buttons
            yearButtons.forEach(button => {
                button.classList.remove('active')
            })

            // add the 'active' class to the clicked button
            e.target.classList.add('active')

            // update the map with the data for the selected year
            updateMap(year)
        })

        let hoveredCountyId = null

        // update featurestate when the mouse moves around within the county layer
        map.on('mousemove', 'fill-election-county', (e) => {
            if (e.features.length > 0) {
                if (hoveredCountyId !== null) {
                    map.setFeatureState(
                        { source: 'election-county', id: hoveredCountyId },
                        { hover: false }
                    );
                }
                hoveredCountyId = e.features[0].id;
                map.setFeatureState(
                    { source: 'election-county', id: hoveredCountyId },
                    { hover: true }
                );
                map.setPaintProperty('fill-election-county', 'fill-opacity', [
                    'case',
                    ['==', ['id'], hoveredCountyId],
                    1,
                    0.5
                ]);
            }
        });
        

        // when the mouse leaves the cd layer, make sure nothing has the hover featurestate
        map.on('mouseleave', 'fill-election-county', () => {
            if (hoveredCountyId !== null) {
                map.setFeatureState(
                    { source: 'election-county', id: hoveredCountyId },
                    { hover: false }
                );
            }
            hoveredCountyId = null;
        });
    })
})
