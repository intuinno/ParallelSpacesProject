if( typeof Object.create !== 'function') {
    
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}


$('#page1').live('pageinit', function() {

	var PSmin = 4.5, PSmax = 5;

	$("#range-1a").on("change", function(event) {

		PSmin = event.target.value;
	});

	$("#range-1b").on("change", function(event) {

		PSmax = event.target.value;
	});

	var w = 600;
	var h = 600;
	var margin = 20;
	var jobList = ['administrator',
    'artist',
    'doctor',
    'educator',
    'engineer',
    'entertainment',
    'executive',
    'healthcare',
    'homemaker',
    'lawyer',
    'librarian',
    'marketing',
    'none',
    'other',
    'programmer',
    'retired',
    'salesman',
    'scientist',
    'student',
    'technician',
    'writer'];
    

 function updateDisplay(space, selectionState) {


            var mySelectionState = selectionState;
            
            if ( space === "movie") {
                var mySelectionGroup = svgMovieSelectionGroup;
                var myQueryGroup = svgUserSelectionGroup;
                var xSelect = xValue;
                var ySelect = yValue;
                var rSelect = rMovieScale;
                
                var xQuery = xValueUser;
                var yQuery = yValueUser;
                var rQuery = rUserScale;
                
            } else if (space === 'user') {
                var mySelectionGroup = svgUserSelectionGroup;
                var myQueryGroup = svgMovieSelectionGroup;
                
                var xSelect = xValueUser;
                var ySelect = yValueUser;
                var rSelect = rUserScale;
                
                var xQuery = xValue;
                var yQuery = yValue;
                var rQuery = rMovieScale;
                
                 }

            //Movie Selection Halo
            mySelectionGroup.selectAll("g").data(mySelectionState.querySetsList, function(d) {
                return +d.assignedClass;
            }).enter().append("g").each(function(d, i) {

                var color = ordinalColor(d.assignedClass);

                var selectionCircle = d3.select(this).selectAll("circle").data(d.selection).enter().append("circle").attr("cx", function(d) {
                    return xSelect(d);
                }).attr("cy", function(d) {
                    return ySelect(d);
                }).attr("r", function(d) {
                    return rSelect(+d.numReview);
                }).attr("fill", color).attr("stroke", color).classed("selectedCircle", true);

            });
            
            //Movie Selection Remove
            mySelectionGroup.selectAll("g").data(mySelectionState.querySetsList, function(d) {
                return +d.assignedClass;
            }).exit().transition().duration(500).remove();

            
            //User Selection Halo
           
            myQueryGroup.selectAll("g").data(mySelectionState.querySetsList, function(d) {
                return +d.assignedClass;
            }).enter().append("g").each(function(d, i) {

                var color = ordinalColor(d.assignedClass);

                var selectionCircle = d3.select(this).selectAll("circle").data(d.query).enter().append("circle").attr("cx", function(d) {
                    return xQuery(d);
                }).attr("cy", function(d) {
                    return yQuery(d);
                }).attr("r", function(d) {
                    return rQuery(+d.numReview);
                }).attr("fill", color).attr("stroke", color).classed("selectedCircle", true);

            });
            
            myQueryGroup.selectAll("g").data(mySelectionState.querySetsList, function(d) {
                return +d.assignedClass;
            }).exit().transition().duration(500).remove();
            
            updateContour(space, mySelectionState);

        }     

 
function reQuery(d) {
    
    if (d.mode === 'single') {
        
        if(d.query.length === 0) {
            
            return [];
        } 
    }
}
    
     
//Class for one single selection    
function QuerySets(domain, query, selection, newClass, mode) {
    
    this.domain = domain; //domain can be 'user' or 'movie'
    this.query =query; 
    this.selection =selection;
    this.assignedClass= newClass;
    this.contourList = [];
    this.mode = mode;  //mode can be  'single', 'groupOR','groupAND'
    
          
}

QuerySets.prototype = {
    isSelected: function(d) {
        if(this.query.indexOf(d) === -1) {
            return false;
        } else {
            return true;
        }
    },
    
    remove: function (d) {
        
        this.query.splice(d,1);
        
        this.selection = reQuery(this);
    }
    
    
}

function SelectionStatesSpace()  {
    
    this.querySetsList = [];
    
    
    
}

SelectionStatesSpace.prototype = {
    
    isSelected: function (d) {
        
        for (var i=0;i<this.querySetsList.length;i++) {
            if ( this.querySetsList[i].isSelected(d)) {
                return true;
            }
        }
        
        return false;
    },
    
    newClass: function (d) {
        
        var newIndex = 0;
        var count =0;
        
        var selectedClassList = this.querySetsList.map(function(d) { return d.assignedClass;});
        
        while ( selectedClassList.indexOf(newIndex) != -1) {
                                newIndex += 1;
                            
        }
        
        return newIndex;
    },
    
    add: function (d) {
        
        this.querySetsList.push(d);
    },
    
    removeEntity: function (d) {
        
        var z;
        
        for (z=0; z < this.querySetsList.length;z++) {
            
            if(this.querySetsList[z].query.indexOf(d) != -1) {
                
                this.querySetsList[z].remove(this.querySetsList[z].query.indexOf(d));
                
                if (this.querySetsList[z].query.length == 0) {
                    
                    this.remove(z);
                }
            }
        }
        
     },
         
    remove: function (d) {
        
        this.querySetsList.splice(d,1);
    }    
      
        
   
}

    //Array of QuerySets to represent selection States
    //selectionStatesMovie is for when movies are selected
    //selectionStatesUser is for when users are selected
    var selectionStatesMovie = new SelectionStatesSpace();
    var selectionStatesUser = new SelectionStatesSpace();
    
    
    //Parameters for Tuning
    var numStepForKDE = 20;
    var numLevelForContour = 10;
	var movieStarHue = 45;
    var userStarHue = 45;
    var maxStarRadius = 10;
    var minStarRadius = 2;
    var fillMovieScale = d3.scale.pow(4).range(["white", "black"]);
    var fillUserScale = d3.scale.pow(4).range(["white", "black"]);
    
    
    //Data for the Analysis
	var ratings;
    var userData;
    var movieData;
    var movieLength;
    var userLength;
    var movieStar, userStar;
    
    
    //State variable for the selection
	var isMovieSelected = false;
	var isGroupSelectionMode = false;
	
    
	
	var movieVQnum = 0;
   
	
	var movieTitle = [];
	var movieTitleOrig = [];

	var ordinalColor = d3.scale.category10();

	
	//Scale variable for movie space
	var xDomainExtent = [0,1];
	var yDomainExtent = [0,1];
	
	var xValue = function (d) {
		return x(+d.X);
	}
 
 	var yValue = function (d) {
		return y(+d.Y);
	}

   
	//variables for Geo mapping
	var proj = d3.geo.albersUsa();
	var path = d3.geo.path().projection(proj);
	var wasLocation = false;
	var wasYAxisUser, wasYValueUser,wasYScaleUser; 
	var myStates, myZip=[];
	var contourMovie =[];
	var contourUser =[];
	var colourCategory =[];


	//Scale variable for user space
	var xDomainExtentUser = [0,1];
	var yDomainExtentUser = [0,1];
	
	var xValueUser = function (d) {
		return xScaleUser(+d.X);
	}
 
 	var yValueUser = function (d) {
		return yScaleUser(+d.Y);
	}	

	var x = d3.scale.linear().range([margin, w - margin]);

	var y = d3.scale.linear().range([ h - margin, margin]);
	
	var rMovieScale = d3.scale.linear().range([minStarRadius, maxStarRadius]);
	

	
	var xAxis	= d3.svg.axis()
					.scale(x)
					.orient("bottom")
					.ticks(5);
					
	var yAxis	= d3.svg.axis()
					.scale(y)
					.orient("left")
					.ticks(5);	
					
	var zoomMovie = d3.behavior.zoom()
					.x(x)
					.y(y)
					.on("zoom",zoomedMovie);
					
	
	var svgMovie = d3.select("#movieCanvas")
					.append("svg")
						.attr("height", h)
						.attr("viewBox", "0 0 " + w + " " +h)
						.attr("title", "Movie Space")
						.style("border", "1px solid silver")
						.attr("transform", "translate(" + margin + "," + margin + ")")
					.append("svg:g");
						//.attr("transform", "translate(" + margin + "," + margin + ")");	
						
	var clip = svgMovie.append("defs")
						.append("svg:clipPath")
						.attr("id","movieClip")
						.append("svg:rect")
						.attr("id","clip-rect")
						.attr("x",margin)
						.attr("y",margin)
						.attr("width",w-2*margin)
						.attr("height",h-2*margin);
						
	var svgMovieBody = svgMovie.append("g")
							.attr("clip-path","url(#movieClip)")
						//	.attr("transform", "translate(" + margin + "," + margin + ")")
							.call(zoomMovie);
							
	var rect = svgMovieBody.append("svg:rect")
							.attr("width",w-margin)
							.attr("height",h-margin)
							.attr("fill","white");
						
						
						

    var svgMovieContourGroup = svgMovieBody.append("svg:g").attr('class','movieContourGroup');
    
	var svgMovieSelectionGroup = svgMovieBody.append("svg:g").attr('class', 'movieSelectionSVGGroup');

	var svgMovieGroup = svgMovieBody.append("svg:g").attr('class', 'movieSVGGroup');
	
						
	svgMovie.append("svg:g")
			.attr("class","x axis")
			.attr("transform","translate(0," + (h-margin) + ")")
			.call(xAxis);
			
	svgMovie.append("svg:g")
			.attr("class","y axis")
			.attr("transform","translate(" + margin + ",0)")
			.call(yAxis);

	d3.csv("data/ratings.csv", function(ratingsCSV) {

		ratings = ratingsCSV;
		userLength = ratings.length;
		movieLength = d3.keys(ratings[0]).length;

	})
	
	d3.json("data/us-states.geojson", function(states) {

		myStates = states;

	})

	d3.csv("data/movieSpaceNoNormal.csv", function(movieCSV) {

		movieData = movieCSV;
		
		//Set up Scales after reading data
		
		rMovieScale.domain(d3.extent(movieData, function(d){ return +d.numReview; }));
		fillMovieScale.domain(d3.extent(movieData, function(d){ return +d.avgReview; }));
		
		

		for (var count = 0; count < movieData.length; count++) {

			movieTitle[count] = movieData[count].title;
			movieTitleOrig[count] = movieData[count].title;
		}

		movieStar = svgMovieGroup.selectAll("circle")
						.data(movieCSV,function(d) {return d.index;})
						.enter()
					.append("svg:circle")
					.classed("movieCircle", true)
					.classed("star", true)
					.attr("cx", xValue)
					.attr("cy", yValue)
					.attr("r", function(d) {
						return rMovieScale(+d.numReview);
					})
					.attr("fill", function(d) {
						return fillMovieScale(+d.avgReview);
					})
					.on('click', function(d, i) {

						var tempGalaxy = [];

						if(isMovieSelected === false) {
						
							
							isMovieSelected = true;
							clearSelection();
						
						}
						if (selectionStatesMovie.isSelected(d) === false) {
                             //Here this star is newly selected 
                             //So Add to the Selection
                             
                             if( isGroupSelectionMode ) {
                                 //Group mode:  Add to the current selection
                                 
                             } else {
                                 //Individual mode: Add to the new selection
                                 
                                 for (var count = 0; count < userLength; count++) {
            
                                     if (ratings[count][i] >= PSmin && ratings[count][i] <= PSmax) {
                
                                        tempGalaxy.push(userData[count]);
                                     }
                                 }
                                 
                                 var newClass = selectionStatesMovie.newClass(); 
                                 var newQuery = [d];
                                 
                                 var tempQuerySet = new QuerySets('movie',newQuery, tempGalaxy, newClass,'single');
                                 
                                 selectionStatesMovie.add(tempQuerySet);
                                 
                                 x.domain(xDomainExtent);
                                 y.domain(yDomainExtent);
                                
                             }
                            
            
                        } else {
                            
                            //Here this star is already selected
                            //So remove it 
                            
                            
                                selectionStatesMovie.removeEntity(d);
    
                                            
                        }
                        
                        updateDisplay('user',selectionStatesMovie); 


					});

		$('.movieCircle').tipsy({
			gravity : 'w',
			html : true,
			fade : true,
			delayOut : 1000,
			title : function() {
				var d = this.__data__, c = d.title;
				return '<a href="' + d.url + '" target="_blank ">' + c + '</a>';
			}
		});

	});

	var xScaleUser = d3.scale.linear().range([margin, w-margin]);
	var yScaleUser = d3.scale.linear().range([h-margin,margin]);
	
	var rUserScale = d3.scale.linear().range([minStarRadius, maxStarRadius]);
	
	
	var xAxisUser = d3.svg.axis()
						.scale(xScaleUser)
						.orient("bottom")
						.ticks(5);
						
	var yAxisUser = d3.svg.axis()
						.scale(yScaleUser)
						.orient("left")
						.ticks(5);
						
	var zoomUser = d3.behavior.zoom()
						.x(xScaleUser)
						.y(yScaleUser)
						.on("zoom", zoomedUser);
						
	var svgUser = d3.select("#userCanvas")
					.append("svg")
						.attr("height", h)
						.attr("viewBox", "0 0 " + w + " " +h)
						.attr("title", "User Space")
						.style("border", "1px solid silver")
						.attr("transform", "translate(" + margin + "," + margin + ")")
					.append("svg:g");
					
	var clip = svgUser.append("defs")
						.append("svg:clipPath")
						.attr("id","userClip")
						.append("svg:rect")
						.attr("id","clip-rect")
						.attr("x",margin)
						.attr("y",margin)
						.attr("width",w-2*margin)
						.attr("height",h-2*margin);
						
	var svgUserBody = svgUser.append("g")
							.attr("clip-path","url(#userClip)")
							.call(zoomUser);
							
	var rect = svgUserBody.append("svg:rect")
							.attr("width",w-margin)
							.attr("height",h-margin)
							.attr("fill","white");
							
	
	 var svgUserContourGroup = svgUserBody.append("svg:g").attr('class','userContourGroup');
	 
	var svgUserSelectionGroup = svgUserBody.append("svg:g").attr('class', 'userSelectionSVGGroup');

	var svgUserGroup = svgUserBody.append("svg:g").attr('class', 'userSVGGroup');



	svgUser.append("svg:g")
			.attr("class","x axis")
			.attr("transform","translate(0," + (h-margin) + ")")
			.call(xAxisUser);
			
	svgUser.append("svg:g")
			.attr("class","y axis")
			.attr("transform","translate(" + margin + ",0)")
			.call(yAxisUser);
	
	d3.csv("data/userSpaceNoNormal.csv", function(userCSV) {

		userData = userCSV;
		
		//Set up Scales after reading data
		
		rUserScale.domain(d3.extent(userData, function(d){ return +d.numReview; }));
		fillUserScale.domain(d3.extent(userData, function(d){ return +d.avgReview; }));
		

		svgUserGroup.selectAll("circle")
					.data(userCSV, function(d) {
						return +d.num;
					})
					.enter()
					.append("circle")
					.classed("userCircle", true)
					.classed("star", true)
					.attr("cx", xValueUser)
					.attr("cy", yValueUser)
					.attr("r", function(d) {
			//  console.log((d.numReview*5)*(d.numReview*10));
						return rUserScale(+d.numReview);

					})
					.attr("fill", function(d) {
							
						return fillUserScale(+d.avgReview);
					})
					.on('click', function(d, i) {

						var tempGalaxy = [];

						if(isMovieSelected === true) {
						
							
							isMovieSelected = false;
							clearSelection();
						
						}
						if (selectionStatesUser.isSelected(d) === false) {
			                 //Here this star is newly selected 
			                 //So Add to the Selection
			                 
			                 if( isGroupSelectionMode ) {
			                     //Group mode:  Add to the current selection
			                     
			                 } else {
			                     //Individual mode: Add to the new selection
			                     
			                     for (var count = 0; count < movieLength; count++) {
            
                                     if (ratings[i][count] >= PSmin && ratings[i][count] <= PSmax) {
                
                                        tempGalaxy.push(movieData[count]);
                                     }
                                 }
			                     
			                     var newClass = selectionStatesUser.newClass(); 
			                     var newQuery = [d];
			                     
			                     var tempQuerySet = new QuerySets('user',newQuery, tempGalaxy, newClass,'single');
                                 
			                     selectionStatesUser.add(tempQuerySet);
			                     
			                     x.domain(xDomainExtent);
                                 y.domain(yDomainExtent);
                                
                                
                                 
                                 
                               
			                 }
			             	
			
						} else {
							
							//Here this star is already selected
							//So remove it 
							
							
    							selectionStatesUser.removeEntity(d);
	
											
						}
						
						updateDisplay('movie',selectionStatesUser); 


					});
					
														
		
       

		$('.userCircle').tipsy({
			gravity : 'w',
			html : true,
			fade : true,
			delayOut : 1000,
			title : function() {
				var d = this.__data__;
				return d.age + ', ' + d.sex + ', ' + d.job;
			}
		});

	})
	function zoomedMovie() {
// 
		svgMovieContourGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgMovieSelectionGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgMovieGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		
		svgMovie.select(".x.axis").call(xAxis);
		svgMovie.select(".y.axis").call(yAxis);
	}
	
	function zoomedUser() {
// 
        svgUserContourGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgUserSelectionGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgUserGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgUser.select(".x.axis").call(xAxisUser);
		svgUser.select(".y.axis").call(yAxisUser);
	}


	function clearSelection() {

		selectionStatesMovie = new SelectionStatesSpace() ;
		selectionStatesUser = new SelectionStatesSpace();
		

		
	}

	
	$(function() {

		$("#searchMovie").autocomplete({
			source : movieTitle,
			target : $('#suggestions'),

			minLength : 1,
			matchFromStart : false,

			callback : function(e) {

				var $a = $(e.currentTarget);
				$('#searchMovie').val($a.text());
				$('#searchMovie').autocomplete('clear');

				var tempGalaxy = [];

				isMovieSelected = true;

				var i = movieTitleOrig.indexOf($a.text());

				selectedMovies.push(i);

				for (var count = 0; count < ratings.length; count++) {

					if (ratings[count][i] >= PSmin && ratings[count][i] <= PSmax) {

						//console.log('The User ' + count +' gave ' + i + 'th  movie 5 star');

						tempGalaxy.push(count);

					}
				}

				userGalaxy.push(tempGalaxy);

				redraw();

			}
		});
	});
	
	$('#movieXAxisMenu').on('change', function() {
		
		var $this = $(this),
			val	= $this.val();
			
			switch (val) {
				case 'sim1':
				
					x = d3.scale.linear().range([margin, w - margin]);

					xDomainExtent = d3.extent(movieData, function(d){return +d.X;});
															
					xValue = function (d) {
						return x(+d.X);
					}
												
					break;
					
				case 'avgReview':
				
					x = d3.scale.linear().range([margin, w - margin]);

					xDomainExtent = d3.extent(movieData, function(d){return +d.avgReview;});
															
					xValue = function (d) {
						return x(+d.avgReview);
					}
										
					break;
					
				case 'numReview':
					
					x = d3.scale.linear().range([margin, w - margin]);
				
					xDomainExtent = d3.extent(movieData, function(d){return +d.numReview;});
															
					xValue = function (d) {
						return x(+d.numReview);
					}
										
					break;
															
				case 'relDate':
				
					var timeFormat = d3.time.format("%e-%b-%Y");
					
					xDomainExtent = d3.extent(movieData, function(d){ return timeFormat.parse(d.date); });
										
					x = d3.time.scale().range([margin, w - margin]);
					
					xValue = function (d) {
						return x((timeFormat.parse(d.date)));
					}
												
					break;
					
					
			}
			
			xAxis.scale(x);
		
			x.domain(xDomainExtent);
		
			y.domain(yDomainExtent);
			
			zoomMovie.x(x).y(y);
			
			svgMovieContourGroup.attr("transform","scale(1)");
													
			svgMovieSelectionGroup.attr("transform", "scale(1)");
			
			svgMovieGroup.attr("transform", "scale(1)");

			svgMovie.selectAll(".y.axis").transition()
					.duration(1000)
					.call(yAxis);
			
			svgMovie.selectAll(".x.axis").transition()
					.duration(1000)
					.call(xAxis);
					
			svgMovieBody.selectAll(".selectedCircle, .star").transition()
				.duration(1000)
				.attr('cx', xValue)
				.attr("cy", yValue);	
				
			updateContour('movie',selectionStatesUser);	
					
	});
	
	
    function updateContour(Space, SelectionStates) {
        
        var mySelectionStates = SelectionStates;
        
        if (Space === 'movie') {
            
            myContourGroup = svgMovieContourGroup;
            
        } else if (Space === 'user') {
            
            myContourGroup = svgUserContourGroup;
        }
        
                
        var min=100, max=-100;
        
        var selectedData2D=[];
   
        var XStep = (x.range()[1] - x.range()[0]) / numStepForKDE;
        var YStep = (y.range()[1] - y.range()[0]) / numStepForKDE;

        var XCoord = d3.range(x.range()[0]-3*XStep, x.range()[1] + 3*XStep, XStep);
        var YCoord = d3.range(y.range()[0]-3*YStep, y.range()[1] + 3*YStep, YStep);
        
        selectedData2D = mySelectionStates.querySetsList.map(function(z, i) {

            tempGalaxy = z.selection;
            
            var tempDataX = tempGalaxy.map(function(d) {
                return xValue(d);
            });

            var tempDataY = tempGalaxy.map(function(d) {
                return yValue(d);
            });

            if (Space === 'movie') {
            var tempDataZ = tempGalaxy.map(function(d) {
                
                var index = 0;
                var myRating =0;
                
                for (index =0; index < z.query.length; index++) {
                    myRating += ratings[z.query[index].num][d.index];    
                } 
                return myRating;
            });
            
            } else if (Space ==='user') {
                
                var tempDataZ = tempGalaxy.map(function(d) {
                
                var index = 0;
                var myRating =0;
                
                for (index =0; index < z.query.length; index++) {
                    myRating += ratings[d.num][z.query[index].index];    
                } 
                return myRating;
            });
                
            }



            var data2D = science.stats.kde2D(tempDataX, tempDataY, tempDataZ, XCoord, YCoord, XStep / 1, YStep / 1);
            
            var minTemp = d3.min(data2D, function(d) { return d3.min(d);});
            var maxTemp = d3.max(data2D, function (d) { return d3.max(d);});
            
            if (minTemp < min) {
                
                min = minTemp;
                
            }
            
            
            if (maxTemp > max) {
                
                max = maxTemp;
                
            } 
            
            return data2D;
            
        });
        
         selectedData2D.map(function (data2D,i) {
             
            var c = new Conrec(), zs = d3.range(min, max, (max - min) / numLevelForContour);

            c.contour(data2D, 0, XCoord.length - 1, 0, YCoord.length - 1, XCoord, YCoord, zs.length, zs);

            mySelectionStates.querySetsList[i].contourList =  c.contourList();

        });
        
         for (var j = 0; j < 10; j++)
            colourCategory[j] = d3.scale.linear().domain([min, max]).range(["#fff", ordinalColor(j)]);

        
        var contourGroup = myContourGroup.selectAll("g")
                        .data(mySelectionStates.querySetsList, function(d) {return d.assignedClass;});
                        
            contourGroup.enter().append("g");
      
      
                        contourGroup.each(function(d, i) {

                            var f = d.assignedClass;


                            var paths =   d3.select(this)
                                .selectAll("path")
                                .data(d.contourList, function(d) {
                                    return d.level;
                                });
                             
                             
                            paths.enter()
                                .append("path");
                                
                                
                                paths.style("fill", function(d) {

                                    return colourCategory[f](d.level);
                                }).transition().delay(500).duration(1000)
                                 .attr("d", d3.svg.line().x(function(d) {
                                    return +(d.x);
                                }).y(function(d) {
                                    return +(d.y);
                                })).attr("fill-opacity",0.01)
                                .transition().duration(300)
                                .attr("fill-opacity",0.8);
                                
                                
                          
                                
                          
                                
                               paths.exit()
                                .remove();

                        });
                        
                                          
                contourGroup.exit().transition().duration(500).remove();
        
    }

	
	$('#movieYAxisMenu').on('change', function() {
		
		var $this = $(this),
			val	= $this.val();
			
			switch (val) {
				case 'sim2':
				
					y = d3.scale.linear().range([ h - margin, margin]);

					yDomainExtent = d3.extent(movieData, function(d){return +d.Y;});
															
					yValue = function (d) {
						return y(+d.Y);
					}
												
					break;
					
				case 'avgReview':
				
					y = d3.scale.linear().range([ h - margin, margin]);

					yDomainExtent = d3.extent(movieData, function(d){return +d.avgReview;});
															
					yValue = function (d) {
						return y(+d.avgReview);
					}
										
					break;
					
				case 'numReview':
				
					y = d3.scale.linear().range([ h - margin, margin]);

					yDomainExtent = d3.extent(movieData, function(d){return +d.numReview;});
															
					yValue = function (d) {
						return y(+d.numReview);
					}
										
					break;
															
				case 'relDate':
				
					var timeFormat = d3.time.format("%e-%b-%Y");
					
					yDomainExtent = d3.extent(movieData, function(d){ return timeFormat.parse(d.date); });
										
					y = d3.time.scale().range([ h - margin, margin]);
					
					yValue = function (d) {
						return y((timeFormat.parse(d.date)));
					}
												
					break;
					
					
			}
			
			yAxis.scale(y);
		
			x.domain(xDomainExtent);
		
			y.domain(yDomainExtent);
			
			zoomMovie.x(x).y(y);
			
			svgMovieContourGroup.attr("transform","scale(1)");
													
			svgMovieSelectionGroup.attr("transform", "scale(1)");
			
			svgMovieGroup.attr("transform", "scale(1)");

			svgMovie.selectAll(".y.axis").transition()
					.duration(1000)
					.call(yAxis);
			
			svgMovie.selectAll(".x.axis").transition()
					.duration(1000)
					.call(xAxis);
					
			svgMovieBody.selectAll(".selectedCircle, .star").transition()
				.duration(1000)
				.attr('cx', xValue)
				.attr("cy", yValue);		
				
		     updateContour('movie',selectionStatesUser);
	});
	
	$('#userXAxisMenu').on('change', function() {
		
		var $this = $(this),
			val	= $this.val();
			
			if(val === 'location') {
    					
    			wasLocation = true;
    			
    			$('#userYAxisMenu').selectmenu('disable');
    			
				wasYAxisUser = yAxisUser;
				wasYValueUser = yValueUser;
				wasYScaleUser = yScaleUser;
		
				var locationGroup = svgUserSelectionGroup.append("g").attr("id","states");
		
		
				d3.select("#states").selectAll("path")
						.data(myStates.features)
					.enter().append("path")
						.attr("d",path);
		
				xValueUser = function (d) {
					
								var p = proj([d.lon, d.lat]);
								
								return p[0];
							}
							
				yValueUser = function (d) {
		
								var p = proj([d.lon, d.lat]);
								
								return p[1];
				}
												
												
				svgUserBody.selectAll(".selectedCircle, .star").transition()
						.duration(1000)
						.attr('cx', xValueUser)
						.attr("cy", yValueUser);	
						
			} else {
				
				if(wasLocation === true) {
					
					$('#userYAxisMenu').selectmenu('enable');
				
					wasLocation = false;	
					
					yScaleUser = wasYScaleUser;
					yAxisUser = wasYAxisUser;
					yValueUser  = wasYValueUser;
					
					d3.select("#states").remove();
					
				}
				
				
				switch (val) {
				
				case 'sim1':
				
					
				
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					
					xDomainExtentUser = d3.extent(userData, function(d){return +d.X;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.X);
					}
					
												
					break;
					
				case 'avgReview':
				
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					xDomainExtentUser = d3.extent(userData, function(d){return +d.avgReview;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.avgReview);
					}
					
										
					break;
					
				case 'numReview':
					
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					xDomainExtentUser = d3.extent(userData, function(d){return +d.numReview;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.numReview);
					}
					
					
					break;
															
				case 'age':
					
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					xDomainExtentUser = d3.extent(userData, function(d){return +d.age;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.age);
					}
					
										
					break;
					
				case 'gender':
					
					xScaleUser = d3.scale.ordinal().rangePoints([margin, w - margin],1);

					xDomainExtentUser = ['M','F'];
															
					xValueUser = function (d) {
						return xScaleUser(d.sex);
					}
							
					
								
					break;
					
				case 'job':
					
					xScaleUser = d3.scale.ordinal().rangePoints([margin, w - margin],1);

					xDomainExtentUser = jobList;
															
					xValueUser = function (d) {
						return xScaleUser(d.job);
					}
					
										
					break;
					
			}
			
			xAxisUser.scale(xScaleUser);
		
			xScaleUser.domain(xDomainExtentUser);
		
			yScaleUser.domain(yDomainExtentUser);
			
			zoomUser.x(xScaleUser).y(yScaleUser);
													
			svgUserSelectionGroup.attr("transform", "scale(1)");
			
			svgUserGroup.attr("transform", "scale(1)");

			svgUser.selectAll(".y.axis").transition()
					.duration(1000)
					.call(yAxisUser);
			
			svgUser.selectAll(".x.axis").transition()
					.duration(1000)
					.call(xAxisUser);
					
			svgUserBody.selectAll(".selectedCircle, .star").transition()
				.duration(1000)
				.attr('cx', xValueUser)
				.attr("cy", yValueUser);	
				
			}
						
	});

    $('#userYAxisMenu').on('change', function() {
        
        var $this = $(this),
            val = $this.val();
            
           
               
                
                switch (val) {
                
                case 'sim2':
                
                    
                
                    yScaleUser = d3.scale.linear().range([h-margin, margin]);

                    
                    yDomainExtentUser = d3.extent(userData, function(d){return +d.Y;});
                                                            
                    yValueUser = function (d) {
                        return yScaleUser(+d.Y);
                    }
                    
                                                
                    break;
                    
                case 'avgReview':
                
                    yScaleUser = d3.scale.linear().range([h-margin, margin]);

                    yDomainExtentUser = d3.extent(userData, function(d){return +d.avgReview;});
                                                            
                    yValueUser = function (d) {
                        return yScaleUser(+d.avgReview);
                    }
                    
                                        
                    break;
                    
                case 'numReview':
                    
                    yScaleUser = d3.scale.linear().range([h-margin, margin]);

                    yDomainExtentUser = d3.extent(userData, function(d){return +d.numReview;});
                                                            
                    yValueUser = function (d) {
                        return yScaleUser(+d.numReview);
                    }
                    
                    
                    break;
                                                            
                case 'age':
                    
                    yScaleUser = d3.scale.linear().range([h-margin, margin]);

                    yDomainExtentUser = d3.extent(userData, function(d){return +d.age;});
                                                            
                    yValueUser = function (d) {
                        return yScaleUser(+d.age);
                    }
                    
                                        
                    break;
                    
                case 'gender':
                    
                    yScaleUser = d3.scale.ordinal().rangePoints([h-margin, margin],1);

                    yDomainExtentUser = ['M','F'];
                                                            
                    yValueUser = function (d) {
                        return yScaleUser(d.sex);
                    }
                            
                   
                                
                    break;
                    
                case 'job':
                    
                    yScaleUser = d3.scale.ordinal().rangePoints([h-margin, margin],1);

                    yDomainExtentUser = jobList;
                                                            
                    yValueUser = function (d) {
                        return yScaleUser(d.job);
                    }
                    
                                        
                    break;
                    
            }
            
            yAxisUser.scale(yScaleUser);
        
            yScaleUser.domain(yDomainExtentUser);
        
            xScaleUser.domain(xDomainExtentUser);
            
            zoomUser.x(xScaleUser).y(yScaleUser);
                                                    
            svgUserSelectionGroup.attr("transform", "scale(1)");
            
            svgUserGroup.attr("transform", "scale(1)");

            svgUser.selectAll(".y.axis").transition()
                    .duration(1000)
                    .call(yAxisUser);
            
            svgUser.selectAll(".x.axis").transition()
                    .duration(1000)
                    .call(xAxisUser);
                    
            svgUserBody.selectAll(".selectedCircle, .star").transition()
                .duration(1000)
                .attr('cx', xValueUser)
                .attr("cy", yValueUser);    
                
            
                        
    });

			
	

});
