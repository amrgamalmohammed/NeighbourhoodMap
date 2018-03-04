$(document).ready(function () {

    // favourite places
    var list = [
        {
            name: "Eiffel Tower",
            location: {lat: 48.858249354605626, lng: 2.2944259643554683}
        },
        {
            name: "Musée du Louvre",
            location: {lat: 48.86084691113991, lng: 2.336440086364746}
        },
        {
            name: "Cathédrale Notre-Dame de Paris",
            location: {lat: 48.85312443201169, lng: 2.3495614528656006}
        },
        {
            name: "Arc de Triomphe",
            location: {lat: 48.873783275868725, lng: 2.2950589656829834}
        },
        {
            name: "Tuileries Garden",
            location: {lat: 48.863641957269515, lng: 2.326483726501465}
        },
        {
            name: "KB CaféShop",
            location: {lat: 48.88072805832777, lng: 2.3405863041415578}
        },
        {
            name: "O Coffeeshop",
            location: {lat: 48.8491347771002, lng: 2.2910040414363038}
        }
    ];

    // map object
    var map;

    // app viewModel
    function ViewModel() {
        var self = this;
        // input field
        self.search = ko.observable("");
        // list observable items
        self.list = ko.observableArray(list);
        // create array of markers
        self.markers = [];
        // apply filter to markers array
        self.places = applyFilter(self);
        // map bounds
        var bounds = new google.maps.LatLngBounds();
        // create infoWindow
        var infoWindow = new google.maps.InfoWindow();
        // show/hide button toggle
        $("#hide-button").click(function () {
            $(this).text($(this).text() == "Hide" ? "Show" : "Hide");
            $("#search-input").fadeToggle();
            $("#list-items").fadeToggle();
            $("#footer").fadeToggle();
        });
        // initialize the map
        initMap();
        // check if something went wrong
        if (!map) {
            window.alert("Google Map didn't load correctly !");
        }
        // create markers
        for (var i = 0; i < list.length; i++) {
            var marker = createMarker(list[i], i);
            marker.addListener('click', (function () {
                // apply marker animation then show infoWindow
                map.setCenter({lat: marker.getPosition().lat(),lng: marker.getPosition().lng()});
                map.setZoom(13);
                toggleBounce(this);
                getPlaceDetails(this, infoWindow);
            }));
            self.markers.push(marker);
            bounds.extend(marker.position);
        }
        // fit map bounds to markers
        map.fitBounds(bounds);
        // listeners of list items
        self.clickItem = function (place) {
            var marker = findMarker(self.markers, place.name);
            // apply marker animation then show infoWindow
            map.setCenter({lat: marker.getPosition().lat(),lng: marker.getPosition().lng()});
            map.setZoom(13);
            toggleBounce(marker);
            getPlaceDetails(marker, infoWindow);
        };
    }

    // initialize map
    function initMap() {

        map = new google.maps.Map(document.getElementById("map-container"), {
            center: {lat: 31.2240346, lng: 29.8144577},
            zoom: 13,
            mapTypeControl: false
        });
    }

    // create markers on map
    function createMarker(place, id) {

        return new google.maps.Marker({
            map: map,
            position: place.location,
            title: place.name,
            animation: google.maps.Animation.DROP,
            id: id
        });
    }

    // show given marker on map
    function showMarker(marker) {
        marker.setMap(map);
    }

    //hide given marker from map
    function hideMarker(marker) {
        marker.setMap(null);
    }

    // toggle bouncing animation
    function toggleBounce(marker) {

        if (marker.getAnimation() != null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 1400);
        }
    }

    // filter locations list
    function applyFilter(self) {

        return ko.computed(function () {
            var filter = self.search().toLowerCase();
            if (!filter) {
                ko.utils.arrayMap(self.markers, function (marker) {
                    showMarker(marker);
                });
               return ko.observableArray(self.list())();
            }
            else {
                return ko.utils.arrayFilter(self.list(), function (item) {
                    var result = (item.name.toLowerCase().indexOf(filter) !== -1);
                    // get associated marker
                    var marker = findMarker(self.markers, item.name);
                    if (result) {
                        showMarker(marker);
                    }
                    else {
                        hideMarker(marker);
                    }
                    return result;
                });
            }
        }, self);
    }

    // return marker associated with a place
    function findMarker(markers, place) {
        return markers.find(function (value) {
            return value.title.toLowerCase() === place.toLowerCase();
        });
    }

    // make Foursquare api call for id and information
    function getPlaceDetails(marker, infowindow) {

        var place = marker.getPosition();
        var name = marker.title;
        // get id of location from Foursquare
        $.ajax({
            url: "https://api.foursquare.com/v2/venues/search"+
                 "?client_id=YWMQC5J3CQIZKXADOM4WCZFQO0L0UTSVTL30OEPUWFNJWFSJ"+
                 "&client_secret=PPOQGMNCDINMRDVYRQUKRHYA2GVUHFD5IVA04L3M2INSURSQ"+
                 "&v=20170801"+
                 "&ll="+place.lat()+","+place.lng()+
                 "&query="+name+
                 "&limit=1",
            type: "GET",
            datatype : "application/json",
            async: true,
            success: function (result) {
                var details = {id:"", name:"", address:"", picture:""};
                details.name = result.response.venues[0].name;
                details.id = result.response.venues[0].id;
                details.address = result.response.venues[0].location.formattedAddress;
                // make call for Foursquare images
                getPlaceImage(details, marker, infowindow);
            },
            error: function (jqXHR, status, error) {
                window.alert("Couldn't get place information from Foursquare\nError:" + error);
            }
        });
    }

    // make Foursquare api call for image
    function getPlaceImage(details, marker, infowindow) {

        var id = details.id;
        $.ajax({
            url: "https://api.foursquare.com/v2/venues/"+id+"/photos"+
                 "?client_id=YWMQC5J3CQIZKXADOM4WCZFQO0L0UTSVTL30OEPUWFNJWFSJ"+
                 "&client_secret=PPOQGMNCDINMRDVYRQUKRHYA2GVUHFD5IVA04L3M2INSURSQ"+
                 "&v=20170801"+
                 "&limit=1",
            type: "GET",
            datatype : "application/json",
            async: true,
            success: function (result) {
                // parse response
                var image = result.response.photos.items[0];
                details.picture = image.prefix+"width200"+image.suffix;
                // populate details to infoWindow
                populateInfoWindow(details, marker, infowindow);
            },
            error: function (jqXHR, status, error) {
                window.alert("Couldn't get place image from Foursquare\nError:" + error);
            }
        });
    }

    // populate infoWindow with info from Foursquare
    function populateInfoWindow(details, marker, infowindow) {

        var content = '<div class="card" style="width: 12rem;">\n' +
            '  <img class="card-img-top" src="'+details.picture+'" alt="Card image cap">\n' +
            '  <div class="card-body">\n' +
            '    <h5 class="card-title">'+details.name+'</h5>\n' +
            '    <p class="card-text">'+details.address+'</p>\n' +
            '  </div>\n' +
            '</div>';
        // check if infoWindow is already opened
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent(content);
            infowindow.open(map, marker);
            // clear marker when infoWindow is closed
            infowindow.addListener("closeclick", function(){
                infowindow.setMarker = null;
            });
        }
    }

    // apply knockout bindings to viewModel
    ko.applyBindings(new ViewModel());
});